import {
	OmFileReader,
	FileBackend,
	MemoryHttpBackend,
	type OmFileReaderBackend,
	type Range,
	OmDataType,
	CompressionType,
	S3Backend
} from '@openmeteo/file-reader';
import { writable } from 'svelte/store';

// Utility function to get enum key by value
function getEnumKeyByValue<T extends Record<string, unknown>>(
	enumObj: T,
	value: T[keyof T]
): keyof T | undefined {
	return Object.keys(enumObj).find((key) => enumObj[key as keyof T] === value) as
		| keyof T
		| undefined;
}

// Define the store state interface
interface OmFileReaderState {
	reader: OmFileReader | null;
	currentTimestamp: number;
	maxTimestamp: number;
	dimensions: number[];
	timeIndex: number;
	latIndex: number;
	lonIndex: number;
	metadata: Record<string, unknown>;
	plotData: {
		z: number[][];
		type: string;
		colorscale: string;
		zmin: number;
		zmax: number;
	} | null;
	isLoading: boolean;
	error: string | null;
}

// Initial state
const initialState: OmFileReaderState = {
	reader: null,
	currentTimestamp: 0,
	maxTimestamp: 0,
	dimensions: [],
	timeIndex: 2,
	latIndex: 0,
	lonIndex: 1,
	metadata: {},
	plotData: null,
	isLoading: false,
	error: null
};

// Create the writable store
const { subscribe, set, update } = writable<OmFileReaderState>(initialState);

// Store actions
const OmFileReaderStore = {
	subscribe,

	/**
	 * Creates the appropriate backend based on the input type (URL or File)
	 */
	async createBackend(input: string | File): Promise<OmFileReaderBackend> {
		// Check if input is a File object (local file)
		if (input instanceof File) {
			console.log('Creating FileBackend for local file:', input.name);
			return new FileBackend(input);
		}

		// Input is a URL string
		const url = input as string;

		// Check if it's an S3 URL
		if (url.startsWith('s3://')) {
			console.log('Creating S3Backend.');
			return new S3Backend({
				region: 'us-west-2',
				bucket: 'openmeteo',
				key: 'data_spatial/dwd_icon_d2/2025/04/26/0000Z/temperature_2m.om',
				cacheEnabled: true
			});
		}

		// For HTTP or HTTPS URLs, use MemoryHttpBackend
		console.log('Creating MemoryHttpBackend for URL:', url);
		return new MemoryHttpBackend({
			url: url,
			maxFileSize: 500 * 1024 * 1024, // 500 MB
			debug: true,
			onProgress: (loaded, total) => {
				const percent = Math.round((loaded / total) * 100);
				console.log(`Downloaded: ${loaded} / ${total} bytes (${percent}%)`);
			}
		});
	},

	/**
	 * Loads the file and initializes the reader
	 */
	async loadFile(input: string | File): Promise<void> {
		update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			// Create appropriate backend
			const backend = await this.createBackend(input);

			// Create and initialize the OM file reader
			const reader = await OmFileReader.create(backend);

			update((state) => ({ ...state, reader }));

			// Load metadata
			await this.loadMetadata();

			// Setup dimensions
			this.setupDimensions();

			update((state) => ({ ...state, isLoading: false }));
		} catch (error) {
			console.error('Error loading file:', error);
			update((state) => ({
				...state,
				isLoading: false,
				error: error instanceof Error ? error.message : String(error)
			}));
		}
	},

	/**
	 * Load metadata from the file
	 */
	async loadMetadata(): Promise<void> {
		const state = await new Promise<OmFileReaderState>((resolve) => {
			update((s) => {
				resolve(s);
				return s;
			});
		});

		if (!state.reader) return;

		try {
			// Get metadata
			const children = state.reader.numberOfChildren();
			const variableName = state.reader.getName();
			const dimensions = state.reader.getDimensions();
			const compression = state.reader.compression();
			const dataType = state.reader.dataType();
			const chunkDimensions = state.reader.getChunkDimensions();

			const metadata = {
				children,
				variableName,
				dimensions,
				compression: getEnumKeyByValue(CompressionType, compression),
				dataType: getEnumKeyByValue(OmDataType, dataType),
				chunkDimensions
			};

			console.log('Metadata:', metadata);

			// Update the state with metadata
			update((s) => ({ ...s, metadata }));
		} catch (error) {
			console.warn("Couldn't load metadata:", error);
		}
	},

	/**
	 * Setup dimensions
	 */
	setupDimensions(): void {
		update((state) => {
			if (!state.reader) return state;

			// Get dimensions
			const dimensions = state.reader.getDimensions();

			if (dimensions.length < 2) {
				throw new Error('Data must have at least 2 dimensions');
			}

			// Set max timestamp based on the time dimension
			const maxTimestamp = dimensions[state.timeIndex] - 1;

			return {
				...state,
				dimensions,
				maxTimestamp,
				currentTimestamp: 0
			};
		});
	},

	/**
	 * Update dimension indices
	 */
	updateDimensionIndices(latIndex: number, lonIndex: number, timeIndex: number): void {
		update((state) => {
			if (!state.reader) return state;

			// Update indices
			const newTimeIndex = timeIndex;
			const newLatIndex = latIndex;
			const newLonIndex = lonIndex;

			// Recalculate max timestamp
			const maxTimestamp = state.dimensions[newTimeIndex] - 1;

			return {
				...state,
				timeIndex: newTimeIndex,
				latIndex: newLatIndex,
				lonIndex: newLonIndex,
				maxTimestamp,
				currentTimestamp: 0
			};
		});
	},

	/**
	 * Navigate to the previous timestamp
	 */
	async previousTimestamp(): Promise<void> {
		let shouldLoadData = false;

		update((state) => {
			if (state.currentTimestamp <= 0) return state;
			shouldLoadData = true;
			return {
				...state,
				currentTimestamp: state.currentTimestamp - 1
			};
		});

		if (shouldLoadData) {
			await this.loadData();
		}
	},

	/**
	 * Navigate to the next timestamp
	 */
	async nextTimestamp(): Promise<void> {
		let shouldLoadData = false;

		update((state) => {
			if (state.currentTimestamp >= state.maxTimestamp) return state;
			shouldLoadData = true;
			return {
				...state,
				currentTimestamp: state.currentTimestamp + 1
			};
		});

		if (shouldLoadData) {
			await this.loadData();
		}
	},

	/**
	 * Loads data for the current timestamp and dimensions
	 */
	async loadData(): Promise<void> {
		const state = await new Promise<OmFileReaderState>((resolve) => {
			update((s) => {
				resolve(s);
				return s;
			});
		});

		if (!state.reader) {
			update((s) => {
				s.isLoading = false;
				s.error = 'Reader not initialized';
				return s;
			});
			return;
		}

		try {
			// Create ranges for each dimension
			const ranges: Range[] = state.dimensions.map((dim, i) => {
				if (i === state.timeIndex) {
					// Time dimension - select only current timestamp
					return {
						start: state.currentTimestamp,
						end: state.currentTimestamp + 1
					};
				} else {
					// Other dimensions - select all
					return { start: 0, end: dim };
				}
			});

			// Read data for the specified dimensions
			const data = await state.reader.read(OmDataType.FloatArray, ranges);

			// Reshape data for plotting
			const rows = state.dimensions[state.latIndex];
			const cols = state.dimensions[state.lonIndex];
			const z: number[][] = [];

			// Create 2D array for heatmap
			for (let i = 0; i < rows; i++) {
				const row: number[] = [];
				for (let j = 0; j < cols; j++) {
					row.push(data[i * cols + j]);
				}
				z.push(row);
			}

			// Find min/max for color scaling
			let min = Number.POSITIVE_INFINITY;
			let max = Number.NEGATIVE_INFINITY;

			for (let i = 0; i < data.length; i++) {
				if (!isNaN(data[i])) {
					if (data[i] < min) min = data[i];
					if (data[i] > max) max = data[i];
				}
			}

			// Create heatmap configuration
			const plotData = {
				z,
				type: 'heatmap',
				colorscale: 'Viridis',
				zmin: min,
				zmax: max
			};

			// Update the state with plot data
			update((s) => ({ ...s, plotData, isLoading: false }));
		} catch (error) {
			console.error('Error loading data:', error);
			update((s) => ({
				...s,
				isLoading: false,
				error: error instanceof Error ? error.message : String(error)
			}));
		}
	},

	// Reset to initial state
	reset(): void {
		set(initialState);
	}
};

export default OmFileReaderStore;
