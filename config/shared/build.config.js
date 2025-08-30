// Shared Build Configuration for algo_webapp
// This file contains common build configuration used by both development and production

const sharedBuildConfig = {
  // Common build settings
  build: {
    // Output directory
    outputDir: 'build',
    
    // Source directories
    sourceDirs: ['src', 'public'],
    
    // Asset optimization
    assets: {
      images: {
        formats: ['webp', 'avif', 'png', 'jpg', 'jpeg'],
        optimization: true,
        maxSize: 1024 * 1024 // 1MB
      },
      fonts: {
        formats: ['woff2', 'woff', 'ttf'],
        optimization: true
      }
    }
  },

  // Common webpack settings
  webpack: {
    // Module resolution
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {
        '@': 'src',
        '@components': 'src/components',
        '@hooks': 'src/hooks',
        '@utils': 'src/utils',
        '@types': 'src/types'
      }
    },

    // Performance hints
    performance: {
      hints: 'warning',
      maxEntrypointSize: 512 * 1024, // 512KB
      maxAssetSize: 1024 * 1024 // 1MB
    }
  },

  // Common optimization settings
  optimization: {
    // Code splitting
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    },

    // Tree shaking
    usedExports: true,
    sideEffects: false
  }
};

module.exports = sharedBuildConfig;
