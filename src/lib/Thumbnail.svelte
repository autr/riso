<script>


    let thumbnail
    let thumbTimeout, thumbLookup
    // async function renderThumbnail() {

    //  if (thumbTimeout) {
    //      clearTimeout( thumbTimeout )
    //      thumbTimeout = null
    //  }
    //  thumbTimeout = setTimeout( e => {

    //  }, 1000)



    // }

    async function renderThumbnail() {

        // console.log('doing render...')
        // // await pixi.app.renderer.render(pixi.app.stage)
        // let {width,height} = calculate
        // let ctx = thumbnail.getContext('2d')
        // thumbnail.width = width > height ? 140 : 100
        // thumbnail.height = width > height ? 100 : 140
        // ctx.drawImage( (new PIXI.Extract(pixi.app.renderer)).image(layers.processed), 0, 0, thumbnail.width, thumbnail.height)
        // // let base64 = (new PIXI.Extract(pixi.app.renderer)).base64(layers.groups[0])
        // THUMBS[IDX] = thumbnail.toDataURL()
        // console.log('rendered?')
    }
</script>
                <div class="hidden abs" style="left:-99999px;top:-99999px" >
                <!-- <div > -->
                    <canvas class="b1-solid" id="thumbnail" bind:this={thumbnail} />
                    <img class="b1-solid" src={THUMBS[IDX]} />
                </div>