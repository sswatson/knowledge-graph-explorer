import esbuild from 'esbuild';

const isWatchMode = process.argv.includes('--watch');

async function main() {
  const options: esbuild.BuildOptions = {
    entryPoints: ['./src/index.ts'],
    bundle: true,
    outdir: 'dist',
    minify: false,
    sourcemap: true,
    platform: 'browser',
    format: "esm",
    target: 'es6',
  };

  if (isWatchMode) {
    let ctx = await esbuild.context(options);
    await ctx.watch();
  } else {
    esbuild.build(options).catch(() => process.exit(1));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});