<script>
	import options from './_options.js'

	export let project

</script>

<div class="flex rel">
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
<div class="flex rel">
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
<div class="flex rel">
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
<div class="flex rel">
	<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
		Margin
	</span>
	<input 
		min={0}
		max={ 1 }
		step={1}
		class="w100pc grow"
		style="padding-left:5em"
		type="number" 
		placeholder="Margin" 
		bind:value={project.config.margin} />
</div>
<div class="flex rel">
	<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
		Rows
	</span>
	<input 
		min={0}
		max={ 1 }
		step={1}
		class="w100pc grow"
		style="padding-left:5em"
		type="number" 
		placeholder="Margin" 
		bind:value={project.config.rows} />
</div>
<div class="flex rel">
	<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
		Cols
	</span>
	<input 
		min={0}
		max={ 1 }
		step={1}
		class="w100pc grow"
		style="padding-left:5em"
		type="number" 
		placeholder="Margin" 
		bind:value={project.config.columns} />
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
