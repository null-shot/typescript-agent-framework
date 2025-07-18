import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				isolatedStorage: false,
				singleWorker: true,
				wrangler: { configPath: './wrangler.jsonc' }
			},
		},
	},
	resolve: {
		alias: {
			'@xava-labs/test-utils': '../../packages/test-utils/src/index.ts'
		}
	}
});