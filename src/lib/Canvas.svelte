<script>
    import panzoom from 'panzoom'
    import { onMount } from 'svelte'
    import { dragging, transform, zoom, moving, inited, original } from './_stores.js'
    import rectd from './_rectd.js'

    export let project

    let lastXY
    export let editorEl
    export let edge = 100
    let zoomer
    let zoomEl
    let TIMEOUT
    onMount( async e => {
        window.zoomer = zoomer = panzoom( zoomEl, {
            maxZoom: 20,
            minZoom: 0.02
        } )

        zoomer.on('transform', e => {
            transform.set( zoomer.getTransform() )
        })

        $inited.canvas = true
    })

    let lastWidthHeight
    $: ( p_ => {
        let {width,height} = project.info
        let widthHeight = width + '' + height + '' + JSON.stringify(project.config)
        if (lastWidthHeight == widthHeight || !editorEl) return
        lastWidthHeight = widthHeight
        fitToCanvas()
    })(project)

    function fitToCanvas() {
        let {width,height} = project.info
        let { offsetWidth, offsetHeight } = editorEl
        let zoomX = (offsetWidth - edge) / width
        let zoomY = (offsetHeight - edge) / height

        let canvasRatio = width/height
        let offsetRatio = offsetWidth/offsetHeight
        let zoom = 1
        if (canvasRatio > 1 && offsetRatio < 1) { zoom = zoomX } 
        else if (canvasRatio > 1 && offsetRatio > 1) { zoom = zoomY } 
        else if (canvasRatio < 1 && offsetRatio < 1) { zoom = zoomX } 
        else if (canvasRatio < 1 && offsetRatio > 1) { zoom = zoomY } 
        else { }
        let x = (offsetWidth - (width*zoom))/2
        let y = (offsetHeight - (height*zoom))/2
        zoomer.zoomAbs(0,0,zoom)
        zoomer.moveTo( x, y)
    }


    function togglePreview( b ) {
        console.log('[Canvas] 👁  toggle preview')

        original.set( b )
        // dragging.set(b)
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
    class:grab={!$dragging}
    class:grabbing={$dragging}
    id="canvases"
    class="rel basis70pc pointer grow flex row-center-flex-start maxh100vh overflow-hidden">
    <div
        id="zoom"
        bind:this={zoomEl}
        class="block fill z-index66" >
    </div>
    <div
        id="renderer"
        class="flex fill" >
        <span class="abs t0 l1 h100pc w1em ">
            <span 
                class=" measure-height fill flex column-center-center" 
                style={`height:${project.info.height * $transform.scale}px;transform: translate(0px,${parseInt($transform.y)}px)`}>
                <span class="no-basis p0-2 filled radius1em" />
                <span class="no-basis filled grow" style="width:1px" />
                <span class="no-basis plr1 ptb1 hide rotate90 nowrap">{project.info.height}</span>
                <span class="no-basis filled grow" style="width:1px" />
                <span class="no-basis p0-2 filled radius1em" />
            </span>
        </span>
        <span 
            class="abs t1 l1 w100pc h1em ">
            <span 
                class=" measure-width fill flex row-center-center" 
                style={`margin-left:-1em;width:${project.info.width * $transform.scale}px;transform: translate(${parseInt($transform.x)}px,0px)`}>
                <span class="no-basis p0-2 filled radius1em" />
                <span class="no-basis filled grow" style="height:1px" />
                <span class="no-basis plr1 hide">{project.info.width}</span>
                <span class="no-basis filled grow" style="height:1px" />
                <span class="no-basis p0-2 filled radius1em" />
            </span>
        </span>
        <!-- <span class="w1em h1em bg br1-solid bb1-solid l0 t0 abs" /> -->
        <div class="w100pc h100pc" bind:this={editorEl} />

        <!-- <span class="fill br1-solid bb1-solid" style={`
            margin-left:1px;
            width:${(project.info.width * $transform.scale) + $transform.x}px;
            height:${(project.info.height * $transform.scale) + $transform.y}px;
        `} />
        <span class="fill br1-solid bb1-solid" style={`
            margin-top:1px;
            width:${$transform.x}px;
            height:${$transform.y}px;
        `} /> -->
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