<script>
	import options from './_options.js'

	export let project

</script>

<input 
	bind:value={project.name} 
	type="text" 
	class="w100pc" />

<div class="flex rel grow">
	<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
		Paper
	</span>
	<div class="select w100pc grow">
		<select class="pl5 w100pc align-right" bind:value={project.config.background}>
			{#each options.backgrounds as bg}
				<option value={bg.name} name={bg.name}>{bg.name}</option>
			{/each}
		</select>
	</div>
</div>
<div class="flex row">
	<button 
		on:click={ e => project.config.landscape = !project.config.landscape}
		class="w4em plr0 flex row-center-center br0-solid">
		{#if !project.config.landscape}
			<span class="icon mb0-4 ml0-4">crop_portrait</span>
		{:else}
			<span class="icon mb0-4 ml0-4">crop_landscape</span>
		{/if}
	</button>
	<div class="flex rel grow">
		<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
			Size
		</span>
		<div class="select w100pc grow">
			<select class="pl5 w100pc" bind:value={project.config.size}>
				{#each options.sizes as sz}
					<option value={sz.name} name={sz.name}>{sz.name}</option>
				{/each}
			</select>
		</div>
	</div>
</div>
<div class="flex row cno-basis">
	<div class="flex rel grow basis5pc">
		<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
			DPI
		</span>
		<input 
			min={150}
			max={600}
			step={50}
			type="number" 
			class="w100pc grow"
			style="padding-left:5em"
			placeholder="DPI" 
			bind:value={project.config.dpi} />
	</div>
	<span class="minw1em no-basis" />
	<div class="flex rel grow no-basis">
		<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
			Margin
		</span>
		<input 
			min={7}
			step={1}
			class="w100pc grow"
			style="padding-left:5em"
			type="number" 
			placeholder="Margin" 
			bind:value={project.config.margin} />
	</div>
</div>

<div class="flex rel">
	<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
		Layout
	</span>
	<div class="select w100pc grow">
		<select class="pl5 w100pc" bind:value={project.config.layout}>
			{#each Object.keys(options.layouts) as opt}
				<option value={opt} name={opt}>{opt}</option>
			{/each}
		</select>
	</div>
</div>
