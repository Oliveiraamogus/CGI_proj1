import { loadShadersFromURLS, buildProgramFromSources, setupWebGL } from "../../libs/utils.js";
import { vec2, flatten } from "../../libs/MV.js";

let canvas;
let gl;
let program;
var vao;
let MAX_POINTS = 60000;
let curve_type = 1;
let t_min = 0.00;
let t_max = Math.PI * 2.0;
let a_coef = 1.00;
let b_coef = 1.00;
let c_coef = 0.00;
let current_coef = 'a';

// janela: 2*2 x,y em [-1, 1]
function resize(target) {
    // Aquire the new window dimensions
    const width = target.innerWidth;
    const height = target.innerHeight;

    // Set canvas size to occupy the entire window
    canvas.width = width;
    canvas.height = height;

    canvas.style.width = width;
    canvas.style.height = height;
    gl.aspect = true;
    // Set the WebGL viewport to fill the canvas completely
    gl.viewport( 0, 0, width, height);
    //gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}


function setup(shaders) {
    canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas, { alpha: true, preserveDrawingBuffer: false });

    // Create WebGL programs
    program = buildProgramFromSources(gl, shaders["shader1.vert"], shaders["shader1.frag"]);

    // Handle increasing points event
    document.addEventListener("keydown", function(event) {
        if (event.key === "1") {
            curve_type = 1;
        }
        if (event.key === "2") {
            curve_type = 2;
        }
        if (event.key === "3") {
            curve_type = 3;
        }
        if (event.key === "4") {
            curve_type = 4;
        }
        if (event.key === "5") {
            curve_type = 5;
        }
        if (event.key === "6") {
            curve_type = 6;
        }
        if (event.key === "PageUp") {
            MAX_POINTS += 500
        }
    // Handle decreasing points event
        if (event.key === "PageDown") {
            MAX_POINTS -= 500
        }
    // Handle arrow up key events 
        if (event.key === "ArrowUp") {
            switch (current_coef) {
            case 'a':
                a_coef += 0.01;
                break;
            case 'b':
                b_coef += 0.01;
                break;
            case 'c':
                c_coef += 0.01;
                break;
            default:
                print("out of bounds on the coeffs");//debug only this should never be reached
            }
        }
    // Handle arrow down key events 
        if (event.key === "ArrowDown") {
            switch (current_coef) {
            case 'a':
                a_coef -= 0.01;
                break;
            case 'b':
                b_coef -= 0.01;
                break;
            case 'c':
                c_coef -= 0.01;
                break;
            default:
                print("out of bounds on the coeffs");//debug only this should never be reached
            }
        }
    });


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

/*
    const curve_type_Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, curve_type_Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, curve_type, gl.STATIC_DRAW);

    const a_curve_type = gl.getAttribLocation(program, "a_curve_type");
    gl.vertexAttribIPointer(a_curve_type, 1, gl.UNSIGNED_INT, 0, 0);
    gl.enableVertexAttribArray(a_curve_type);


    const tmin_Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tmin_Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, gl.uniform1f(t_min), gl.STATIC_DRAW);

    const a_t_min = gl.getAttribLocation(program, "a_t_min");
    gl.vertexAttribIPointer(a_t_min, 1, gl.FLOAT, 0, 0);
    gl.enableVertexAttribArray(a_t_min);


    const tmax_Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tmax_Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, t_max, gl.STATIC_DRAW);

    const a_t_max = gl.getAttribLocation(program, "a_t_max");
    gl.vertexAttribIPointer(a_t_max, 1, gl.FLOAT, 0, 0);
    gl.enableVertexAttribArray(a_t_max);


    const a_coef_Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, a_coef_Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, a_coef, gl.STATIC_DRAW);

    const a_a_coef = gl.getAttribLocation(program, "a_a_coef");
    gl.vertexAttribIPointer(a_a_coef, 1, gl.FLOAT, 0, 0);
    gl.enableVertexAttribArray(a_a_coef);


    const b_coef_Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b_coef_Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, b_coef, gl.STATIC_DRAW);

    const a_b_coef = gl.getAttribLocation(program, "a_b_coef");
    gl.vertexAttribIPointer(a_b_coef, 1, gl.FLOAT, 0, 0);
    gl.enableVertexAttribArray(a_b_coef);


    const c_coef_Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, c_coef_Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, c_coef, gl.STATIC_DRAW);

    const a_c_coef = gl.getAttribLocation(program, "a_c_coef");
    gl.vertexAttribIPointer(a_c_coef, 1, gl.FLOAT, 0, 0);
    gl.enableVertexAttribArray(a_c_coef);
*/

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

    const u_curve_type = gl.getUniformLocation(program, "u_curve_type");
    gl.uniform1i(u_curve_type, curve_type);

    const u_max_points = gl.getUniformLocation(program, "u_max_points");
    gl.uniform1i(u_max_points, MAX_POINTS);
    const u_t_min = gl.getUniformLocation(program, "u_t_min");
    gl.uniform1f(u_t_min, t_min);
    const u_t_max = gl.getUniformLocation(program, "u_t_max");
    gl.uniform1f(u_t_max, t_max);
    const u_a_coef = gl.getUniformLocation(program, "u_a_coef");
    gl.uniform1f(u_a_coef, a_coef);
    const u_b_coef = gl.getUniformLocation(program, "u_b_coef");
    gl.uniform1f(u_b_coef, b_coef);
    const u_c_coef = gl.getUniformLocation(program, "u_c_coef");
    gl.uniform1f(u_c_coef, c_coef);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, MAX_POINTS);
    gl.bindVertexArray(null);


    gl.useProgram(null);
}

loadShadersFromURLS(["shader1.vert", "shader1.frag"]).then(shaders => setup(shaders));
