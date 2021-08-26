<script>
    import panzoom from 'panzoom'
    import { onMount } from 'svelte'

    export let project

    let lastXY
    export let editorEl
    let zoomer

    onMount( async e => {
        window.zoomer = zoomer = panzoom( editorEl )
        console.log(zoomer)

        // zoomer.zoomTo( 800, 10, zoom )
    })



    function togglePreview( b ) {
        console.log('[Canvas] 👁  toggle preview')
        // mode = b
        // if (mode) {
        //     // rectd.auto( fit, raw )
        //     // stage.addChild( raw )
        // } else {
        //     // stage.removeChild( raw )
        // }
    }


    let keys = {}

    async function onKeyDown(e) {
        keys[e.key] = true
    }
    async function onKeyUp(e) {
        keys[e.key] = false
    }

</script>

<svelte:window 
    on:keydown={onKeyDown} 
    on:keyup={onKeyUp} />

<section 
    on:mousedown={ e => togglePreview( true ) }
    on:mouseup={ e => togglePreview( false ) }
    class="rel basis70pc minw50em pointer grow flex row-center-flex-start maxh100vh overflow-hidden">
    <div
        id="zoom"
        class="flex fill" >
        <div class="w100pc h100pc" bind:this={editorEl}>
            <canvas id="lores" class="fill" />
        </div>
    </div>
    <div class="t1 l1 abs">
        {project.info.width} x {project.info.height}
    </div>
    <div class="abs t0 r2 p1 flex row w3em">

        <div class="flex column">
            <!-- <button 
                on:click={e => zoom < 2 ? zoom += 0.05 : null }
                class="p0 h3em m0 w3em flex row-center-center" >
                <span class="flex w1em h1em cross rotate45" />
            </button> -->
            <!-- <div class="h10em flex ">
                <input  
                    class="grow p0 m0 h1em round radius1em b1-solid rotate270 abs" 
                    style="left: -1.5em;top: 8.5em;width: 8em;margin-left:-0px;margin-top:-0.5px;background: transparent" 
                    type="range" 
                    min={0.01} 
                    max={3} 
                    step={0.001} 
                    bind:value={zoom} /> 
            </div> -->
            <!-- <button 
                on:click={e => zoom > 0.05 ? zoom -= 0.05 : null }
                class="p0 h3em m0 w3em flex row-center-center" >
                    <span class="flex w1em pt0-5 mt0-5 bt1-solid" />
                </button> -->
            <!-- <button 
                class="p0  m0 h3em w3em flex row-center-center bt0-solid" >
                    ⤢
                </button>
            <button 
                class="p0  m0 h3em w3em flex row-center-center bt0-solid" >
                    A
                </button>
            <button 
                class="p0  m0 h3em w3em flex row-center-center mt1" >
                    ⬚
                </button> -->

                
        </div>
    </div>
</section>