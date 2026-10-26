// zshy builds with the TypeScript JS API, which TypeScript 7 no longer ships
module.exports = {
	hooks: {
		readPackage(pkg) {
			if (pkg.name === 'zshy') {
				delete pkg.peerDependencies.typescript
				pkg.dependencies.typescript = '6.0.3'
			}
			return pkg
		},
	},
}
