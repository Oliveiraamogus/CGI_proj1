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
    gl.viewport(0, 0, width, height);
    //gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}


function setup(shaders) {
    canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas, { alpha: true, preserveDrawingBuffer: false });

    // Create WebGL programs
    program = buildProgramFromSources(gl, shaders["shader1.vert"], shaders["shader1.frag"]);

    
    document.addEventListener("keydown", function (event) {
        switch (event.key){
            case "space":

                break;
            case "r": // reset 
                a_coef = 1.0;
                b_coef = 1.0;
                c_coef = 0.0;
                MAX_POINTS = 60000;
                current_coef = 'a';
                break;
            
            case "1":
                curve_type = 1;
                break;
            case  "2":
                curve_type = 2;
                break;
            case "3":
                curve_type = 3;
                break;
            case "4":
                curve_type = 4;
                break;
            case "5":
                curve_type = 5;
                break;
            case "6":
                curve_type = 6;
                break;
            case "PageUp":
                if (MAX_POINTS != 60000)
                    MAX_POINTS += 500;
                console.log(MAX_POINTS);
                break;
            // Handle decreasing points event
            case "PageDown":
                if (MAX_POINTS != 0)
                    MAX_POINTS -= 500
                console.log(MAX_POINTS)
                break;
            // Handle arrow up key events 
            case "ArrowUp":
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
                break;
            // Handle arrow down key events 
            case "ArrowDown":
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
                break;
            case "ArrowLeft":
                switch (current_coef) {
                    case 'a':
                        current_coef = 'c';
                        break;
                    case 'b':
                        current_coef = 'a';
                        break;
                    case 'c':
                        current_coef = 'b';
                        break;
                    default:
                        print("out of bounds on the coeffs");//debug only this should never be reached
                }
                break;

            case "ArrowRight":
                switch (current_coef) {
                    case 'a':
                        current_coef = 'b';
                        break;
                    case 'b':
                        current_coef = 'c';
                        break;
                    case 'c':
                        current_coef = 'a';
                        break;
                    default:
                        print("out of bounds on the coeffs");//debug only this should never be reached
                }
                break;
        }
    });


    document.addEventListener('wheel', (event) => {
        x = canvas.width;
        y = canvas.height;
        canvas.width -= event.deltaY;
        canvas.height -= event.deltaY;
        //my_resizefunc();
        //resize(window);
        //gl.viewport(0, 0, canvas.width, canvas.height);
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

function my_resizefunc() {
    const dimensions = canvas.width / canvas.height;
    const u_dimensions = gl.getUniformLocation(program, "u_dimensions");
    gl.uniform1f(u_dimensions, dimensions);
}

function animate(timestamp) {
    window.requestAnimationFrame(animate);


    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    my_resizefunc();

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
