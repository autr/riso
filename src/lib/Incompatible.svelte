<script>

	import { incompatible, warning } from './_stores.js'
	import db from './_db.js'

	async function onIgnore() {
		console.log(`[incompatible] 🌶  ignoring incompatibility...`)
		warning.set( false )
		db.set.ignore( true )
	}

</script>




<div 
	id="dialog"
	class="fixed fill flex row-center-center checkered z-index99"
	class:none={!$warning}>

	<aside class=" maxw32em b1-solid">
		<header 
			class="f2 p1 pop bb1-solid flex row-space-between-center">
			<div>
				<span class="icon">web_asset_off</span>
				Unsupported Browser
			</div>
			<span class="w1em h1em cross pointer" on:click={onIgnore} />
		</header>

		<section class="incompatible-text">
			<div class="p1 bg">The app needs to the use the <a class="bb1-solid" target="_blank" href="https://caniuse.com/filesystem">FileSystem API</a>, which is currently only supported by Chrome, Edge and Opera browsers.</div>
			<div class="p1 bg flex column">
				<a class="button pop mb1" target="_blank" href="https://ungoogled-software.github.io/ungoogled-chromium-binaries/">
					<!-- <span class="icon">download</span> -->
					Ungoogled Chromium (recommended)
				</a>
				<a class="button pop " target="_blank" href="https://www.opera.com">
					<!-- <span class="icon">download</span> -->
					Opera Browser (recommended)
				</a>
			</div>
		</section>

		<section class="error-text">

		</section>
	</aside>
</div>