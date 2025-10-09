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
let is_animating = false;
let line_strip = false;
let previous_timestamp = null;
const inc_speed = 0.5;
let size = 2.00;
let offsetX = 0.00;
let offsetY = 0.00;
let x = 0.00;
let y = 0.00;

function resize(target) {
    // Aquire the new window dimensions
    const width = target.innerWidth;
    const height = target.innerHeight;

    // Set canvas size to occupy the entire window
    canvas.width = width;
    canvas.height = height;

    gl.aspect = true;
    // Set the WebGL viewport to fill the canvas completely
    gl.viewport(0, 0, width, height);
    //gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}

function reset_defaults() {
    switch (curve_type) {
        case 1:
            a_coef = 1.0;
            b_coef = 1.0;
            c_coef = 0.0;
            t_min = 0;
            t_max = Math.PI * 2;
            break;
        case 2:
            a_coef = 1.0;
            b_coef = 17.0;
            c_coef = 0.0;
            t_min = 0;
            t_max = Math.PI * 2;
            break;
        case 3:
            a_coef = 1.0;
            b_coef = 8.6;
            c_coef = 0.0;
            t_min = 0;
            t_max = Math.PI * 10;
            break;
        case 4:
            a_coef = 7.6;
            b_coef = 5.1;
            c_coef = 0.0;
            t_min = 0;
            t_max = 10;
            break;
        case 5:
            a_coef = 1.0;
            b_coef = 4.0;
            c_coef = 0.0;
            t_min = 0;
            t_max = 10;
            break;
        case 6:
            a_coef = 4.0;
            b_coef = 1.0;
            c_coef = 0.0;
            t_min = 0;
            t_max = Math.PI * 2;
            break;
    }
}

//handles all the mouse interactions
function mouse() {
    //handles zooming and general wheel interactions
    document.addEventListener('wheel', function (event) {
        size += (event.deltaY / 1000);
    });

    //detects when the mouse is clicked
    var allowed = false;
    var earlyX, earlyY;
    document.addEventListener('mousedown', function (event) {
        earlyX = event.clientX;
        earlyY = event.clientY;
        allowed = true;
    });

    //moves the canvas acording to the movement of the mouse
    document.addEventListener('mousemove', function (event) {
        if (allowed) {
            offsetX = (((event.clientX - earlyX) / canvas.width) * 2) + x;
            console.log(offsetX);
            offsetY = (((earlyY - event.clientY) / canvas.height) * 2) + y;
        }
    });


    //detects when the mouse is no longer pressed
    document.addEventListener('mouseup', function (event) {
        x = offsetX;
        y = offsetY;
        allowed = false;
    });
}

//handles all the keyboard events
function keyboard() {
    document.addEventListener("keydown", function (event) {
        switch (event.key) {
            case " ":
                is_animating = !is_animating;
                break;
            case "p":
                if (line_strip) {
                    line_strip = false;
                }
                else {
                    line_strip = true;
                }
                break;
            case "r": // reset 
                reset_defaults();

                MAX_POINTS = 60000;
                current_coef = 'a';
                is_animating = false;
                size = 2.00;
                offsetX = 0.00;
                offsetY = 0.00;
                x = 0.00;
                y = 0.00;
                break;
            case "1":
                curve_type = 1;
                reset_defaults();
                break;
            case "2":
                curve_type = 2;
                reset_defaults();
                break;
            case "3":
                curve_type = 3;
                reset_defaults();
                break;
            case "4":
                curve_type = 4;
                reset_defaults();
                break;
            case "5":
                curve_type = 5;
                reset_defaults();
                break;
            case "6":
                curve_type = 6;
                reset_defaults();
                break;
            case "PageUp":
                t_max += 0.01;
                break;
            case "PageDown":
                t_max -= 0.01;
            case "+":
                if (MAX_POINTS != 60000)
                    MAX_POINTS += 500;
                console.log(MAX_POINTS);
                break;
            case "-":
                if (MAX_POINTS != 0 && MAX_POINTS > 500)
                    MAX_POINTS -= 500
                break;
            case "ArrowUp":
                if (is_animating)
                    is_animating = false;
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
            case "ArrowDown":
                if (is_animating)
                    is_animating = false;
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

}


function setup(shaders) {
    canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas, { alpha: true, preserveDrawingBuffer: false });


    // Create WebGL programs
    program = buildProgramFromSources(gl, shaders["shader1.vert"], shaders["shader1.frag"]);


    keyboard();

    mouse();


    const indexes = [];

    //generates all the indexes for all the points
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

    resize(window);

    // Handle resize events 
    window.addEventListener("resize", (event) => {
        resize(event.target);
    });

    //sets the background color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    window.requestAnimationFrame(animate);

}

function my_resizefunc() {
    const dimensions = canvas.width / canvas.height;
    const u_dimensions = gl.getUniformLocation(program, "u_dimensions");
    gl.uniform1f(u_dimensions, dimensions);
}

function animate(timestamp) {

    var curve = document.getElementById("curve_id");
    curve.innerHTML = curve_type;
    var t_min_id = document.getElementById("tmin_id");
    t_min_id.innerHTML = t_min.toFixed(2);
    var t_max_id = document.getElementById("tmax_id");
    t_max_id.innerHTML = t_max.toFixed(2);
    var coefs = document.getElementById("coefs_id");
    coefs.innerHTML = [a_coef.toFixed(2), b_coef.toFixed(2), c_coef.toFixed(2)];
    var samples = document.getElementById("samples_id");
    samples.innerHTML = MAX_POINTS;


    if (previous_timestamp == null) previous_timestamp = timestamp;
    // delta time: period between this frame and the last
    // fixes velocity to be linear
    const dt = (timestamp - previous_timestamp) * 0.001;
    previous_timestamp = timestamp;

    if (is_animating) {
        switch (current_coef) {
            case 'a':
                a_coef += dt * inc_speed;
                break;
            case 'b':
                b_coef += dt * inc_speed;
                break;
            case 'c':
                c_coef += dt * inc_speed;
                break;
        }
    }

    window.requestAnimationFrame(animate);


    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    my_resizefunc();

    const u_now = gl.getUniformLocation(program, "u_now");
    gl.uniform1f(u_now, performance.now() * 0.001);

    const u_speed = gl.getUniformLocation(program, "u_speed");
    gl.uniform1f(u_speed, 0.5);

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
    const u_size = gl.getUniformLocation(program, "u_size");
    gl.uniform1f(u_size, size);
    const u_offsetX = gl.getUniformLocation(program, "u_offsetX");
    gl.uniform1f(u_offsetX, offsetX);
    const u_offsetY = gl.getUniformLocation(program, "u_offsetY");
    gl.uniform1f(u_offsetY, offsetY);

    gl.bindVertexArray(vao);
    if (line_strip) {
        gl.drawArrays(gl.LINE_STRIP, 0, MAX_POINTS);
    }
    else {
        gl.drawArrays(gl.POINTS, 0, MAX_POINTS);
    }
    gl.bindVertexArray(null);


    gl.useProgram(null);
}

loadShadersFromURLS(["shader1.vert", "shader1.frag"]).then(shaders => setup(shaders));
