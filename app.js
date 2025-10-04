import { loadShadersFromURLS, buildProgramFromSources, setupWebGL } from "../../libs/utils.js";
import { vec2, flatten } from "../../libs/MV.js";

let canvas;
let gl;
let program;
var vao;
let MAX_POINTS = 60000;

// janela: 2*2 x,y em [-1, 1]
function resize(target) {
    // Aquire the new window dimensions
    const width = target.innerWidth;
    const height = target.innerHeight;

    // Set canvas size to occupy the entire window
    canvas.width = width;
    canvas.height = height;


    // Set the WebGL viewport to fill the canvas completely
    gl.viewport(0, 0, width, height);
}


function setup(shaders) {
    canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas, { alpha: true, preserveDrawingBuffer: false });

    // Create WebGL programs
    program = buildProgramFromSources(gl, shaders["shader1.vert"], shaders["shader1.frag"]);

    const indexes = [];

    function generatePoints(npoints) {
        for (let i = 0; i < npoints; i++) {
            indexes[i] = i;
        }
    }

    generatePoints(MAX_POINTS);

    vao = gl.createVertexArray(vao);
    gl.bindVertexArray(vao);

    const aBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(indexes), gl.STATIC_DRAW);

    const a_index = gl.getAttribLocation(program, "a_index");
    gl.vertexAttribIPointer(a_index, 1, gl.UNSIGNED_INT, 0, 0);
    gl.enableVertexAttribArray(a_index);

    gl.bindVertexArray(null);
    //gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //const u_t = gl.getUniformLocation(program, "u_t")

    resize(window);

    // Handle resize events 
    window.addEventListener("resize", (event) => {
        resize(event.target);
    });


    // Handle mouse move events 
    window.addEventListener("mousemove", (event) => {
        //resize(event.target);
    });

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    window.requestAnimationFrame(animate);
}

function animate(timestamp) {
    window.requestAnimationFrame(animate);


    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // Some drawing code...

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, MAX_POINTS);
    gl.bindVertexArray(null);


    gl.useProgram(null);
}

loadShadersFromURLS(["shader1.vert", "shader1.frag"]).then(shaders => setup(shaders));
