    // If absolute URL from the remote server is provided, configure the CORS
    // header on that server.
    let url = "ppt.pdf"
    // Disable workers to avoid yet another cross-origin issue (workers need
    // the URL of the script to be loaded, and dynamically loading a cross-origin
    // script does not work).
    // PDFJS.disableWorker = true;

    // The workerSrc property shall be specified.
    PDFJS.workerSrc = 'https://unpkg.com/pdfjs-dist@2.0.106/build/pdf.worker.js';


    let pdfDoc = null,
        pageNum = 1,
        pageRendering = false,
        pageNumPending = null,
        scale = 1,
        canvas = document.getElementById('the-canvas'),
        ctx = canvas.getContext('2d');

    /**
     * Get page info from document, resize canvas accordingly, and render page.
     * @param num Page number.
     */
    function renderPage(num) {
        pageRendering = true;
        // Using promise to fetch the page
        pdfDoc.getPage(num).then(function (page) {
            var viewport = page.getViewport(scale);
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into canvas context
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            var renderTask = page.render(renderContext);

            // Wait for rendering to finish
            renderTask.promise.then(function () {
                pageRendering = false;
                if (pageNumPending !== null) {
                    // New page rendering is pending
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });

        // Update page counters
        document.getElementById('page_num').textContent = pageNum;
    }

    /**
     * If another page rendering in progress, waits until the rendering is
     * finised. Otherwise, executes rendering immediately.
     */
    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    /**
     * Displays previous page.
     */
    function onPrevPage() {
        if (pageNum <= 1) {
            return;
        }
        changePage(pageNum, pageNum - 1);
        pageNum--;
        queueRenderPage(pageNum);
    }
    document.getElementById('prev').addEventListener('click', onPrevPage);

    /**
     * Displays next page.
     */
    function onNextPage() {
        if (pageNum >= pdfDoc.numPages) {
            return;
        }
        changePage(pageNum, pageNum + 1);
        pageNum++;
        queueRenderPage(pageNum);
    }
    document.getElementById('next').addEventListener('click', onNextPage);

    /**
     * Asynchronously downloads PDF.
     */
    PDFJS.getDocument(url).then(function (pdfDoc_) {
        pdfDoc = pdfDoc_;
        document.getElementById('page_count').textContent = pdfDoc.numPages;

        // Initial/first page rendering
        renderPage(pageNum);
    });

    



    //////////////////////////////////// Code not related to pdf
    
    let canvass = new fabric.Canvas('c', { isDrawingMode: true});
    let saveData = {};

    // Needed for some reason?
    /*setTimeout(function () {
        canvass.setWidth(document.querySelector('.insideWrapper').clientWidth);
        canvass.setHeight(document.querySelector('.insideWrapper').clientHeight);
    }, 1000);*/
    
    
    function changePage(curPage, nextPage) {
        saveData[curPage] = JSON.stringify(canvass);
        canvass.clear();
        canvass.loadFromJSON(saveData[nextPage]);
    }

    function clear(){
        canvass.clear();
        modifiedHandler();
    }
    document.getElementById('clear').addEventListener('click', clear);


    // Send canvas changes over socket
    let modifiedHandler = function () {
        console.log("Change detected");
        saveData[pageNum] = JSON.stringify(canvass);
        socket.emit('drawingComplete', [pageNum, JSON.stringify(canvass)]);
    };
    canvass.on('path:created', modifiedHandler);

    let socket = io.connect(window.location.href);

    //Update canvas from socket message
    socket.on('drawThis', updateDrawing);
    function updateDrawing(data){
        console.log(data);
        saveData[data[0]] = data[1];
        canvass.loadFromJSON(saveData[pageNum]);
    }

    // Only runs upon first connection
    socket.on('stateData', firstData);
    function firstData (e){
        console.log("Got state data");
        saveData = e;
        canvass.loadFromJSON(saveData[pageNum]);
    }

    // Recieve js from server and execute 
    socket.on('js', (e) => {
        console.log("js");
        eval(e);
    });

    function undo(){
        let temp = JSON.parse(saveData[pageNum]);
        temp.objects.pop();
        saveData[pageNum] = temp;
        updateDrawing(saveData);
        modifiedHandler();// send new data
    }
    document.getElementById('undo').addEventListener('click', undo);


    $('#cp2').colorpicker({color:'black'});

    document.getElementById('cp2').onchange = function() {
        console.log("color change");
        canvass.freeDrawingBrush.color = document.querySelector('#color').value;
      };

    document.getElementById('size').onchange = function() {
        console.log("size change");
        canvass.freeDrawingBrush.width = parseInt(this.value);
    };
    canvass.freeDrawingBrush.width = parseInt(document.getElementById('size').value);