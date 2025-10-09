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
const variation = 0.01;
let size = 2.00;
let offsetX = 0.00;
let offsetY = 0.00;
let x = 0.00;
let y = 0.00;
let allowed = false;
let earlyX, earlyY;
const locs = {};

function handle_u_locs() {
    const names = [
        "u_now", "u_speed", "u_curve_type", "u_max_points",
        "u_t_min", "u_t_max", "u_a_coef", "u_b_coef", "u_c_coef",
        "u_size", "u_offsetX", "u_offsetY", "u_dimensions"
    ];
    names.forEach(i => locs[i] = gl.getUniformLocation(program, i));
}

function resize(target) {
    const width = target.innerWidth;
    const height = target.innerHeight;

    canvas.width = width;
    canvas.height = height;

    gl.aspect = true;
    gl.viewport(0, 0, width, height);
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
    current_coef = 'a';
    size = 2.00;
    offsetX = 0.00;
    offsetY = 0.00;
    x = 0.00;
    y = 0.00;
}

// Handles all the mouse interactions
function handle_mouse_events() {
    // Handles zooming and general wheel interactions
    document.addEventListener('wheel', function (event) {
        size += (event.deltaY / 1000);
    });

    // Detects when the mouse is clicked
    document.addEventListener('mousedown', function (event) {
        earlyX = event.clientX;
        earlyY = event.clientY;
        allowed = true;
    });

    // Moves the canvas acording to the movement of the mouse
    document.addEventListener('mousemove', function (event) {
        if (allowed) {
            offsetX = (((event.clientX - earlyX) / canvas.width) * 2) + x;
            console.log(offsetX);
            offsetY = (((earlyY - event.clientY) / canvas.height) * 2) + y;
        }
    });


    // Detects when the mouse is no longer pressed
    document.addEventListener('mouseup', function () {
        x = offsetX;
        y = offsetY;
        allowed = false;
    });
}

//handles all the keyboard events
function handle_keyboard_events() {
    document.addEventListener("keydown", function (event) {
        switch (event.key) {
            case " ": // Space bar: starts animating the curve
                is_animating = !is_animating;
                break;
            case "p": // Letter p: toggle Lines/Points
                line_strip = !line_strip;
                break;
            case "r": // Letter r: resets configurations
                reset_defaults();
                MAX_POINTS = 60000;
                is_animating = false;
                break;
            case "1": // Number 1: Curve's Family 1
                curve_type = 1;
                reset_defaults();
                break;
            case "2": // Number 2: Curve's Family 2
                curve_type = 2;
                reset_defaults();
                break;
            case "3": // Number 3: Curve's Family 3
                curve_type = 3;
                reset_defaults();
                break;
            case "4": // Number 4: Curve's Family 4
                curve_type = 4;
                reset_defaults();
                break;
            case "5": // Number 5: Curve's Family 5
                curve_type = 5;
                reset_defaults();
                break;
            case "6": // Number 6: Curve's Family 6
                curve_type = 6;
                reset_defaults();
                break;
            case "PageUp": // PageUp key: increments t max
                t_max += 0.01;
                break;
            case "PageDown": // PageDown key: decrements t max
                t_max -= 0.01;
            case "+": // + key: increments samples (points). Minimum 500 samples displayed.
                if (MAX_POINTS != 60000)
                    MAX_POINTS += 500;
                console.log(MAX_POINTS);
                break;
            case "-": // - key: decrements samples (points). Maximum 60000 samples displayed.
                if (MAX_POINTS != 0 && MAX_POINTS > 500)
                    MAX_POINTS -= 500
                break;
            case "ArrowUp": // Arrow up key: increments the selected coefficient
                if (is_animating)
                    is_animating = false;
                switch (current_coef) {
                    case 'a':
                        a_coef += variation;
                        break;
                    case 'b':
                        b_coef += variation;
                        break;
                    case 'c':
                        c_coef += variation;
                        break;
                    default: // Debug only; this should never be reached.
                        console.log("out of bounds on the coeffs");
                }
                break;
            case "ArrowDown": // Arrow down key: decrements the selected coefficient
                if (is_animating)
                    is_animating = false;
                switch (current_coef) {
                    case 'a':
                        a_coef -= variation;
                        break;
                    case 'b':
                        b_coef -= variation;
                        break;
                    case 'c':
                        c_coef -= variation;
                        break;
                    default:  // Debug only; this should never be reached.
                        pconsole.log("out of bounds on the coeffs");
                }
                break;
            case "ArrowLeft": // Arrow left key: switches selected coefficient
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
                    default:  // Debug only; this should never be reached.
                        console.log("out of bounds on the coeffs");
                }
                break;

            case "ArrowRight": // Arrow right key: switches selected coefficient
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
                    default:  // Debug only; this should never be reached.
                        console.log("out of bounds on the coeffs");
                }
                break;
            default:
                console.log("This key does not do anything.");
        }
    });

}

function setup(shaders) {
    canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas, { alpha: true, preserveDrawingBuffer: false });

    program = buildProgramFromSources(gl, shaders["shader1.vert"], shaders["shader1.frag"]);

    handle_u_locs();
    handle_keyboard_events();
    handle_mouse_events();

    // Indexes for all samples.
    const indexes = [];
    for (let i = 0; i < MAX_POINTS; i++)
        indexes[i] = i;

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
    window.addEventListener("resize", (event) => {
        resize(event.target);
    });

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    window.requestAnimationFrame(animate);

}

function resize_window() {
    const dimensions = canvas.width / canvas.height;
    const u_dimensions = gl.getUniformLocation(program, "u_dimensions");
    gl.uniform1f(u_dimensions, dimensions);
}

function setup_dynamic_graphic_interface() {
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
}

// dt means delta time: period between this frame and the last
// fixes velocity to be linear
function handles_animation(timestamp) {
    if (previous_timestamp == null) previous_timestamp = timestamp;
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
}

function send_uniforms() {
    gl.uniform1f(locs.u_now, performance.now() * 0.001);
    gl.uniform1f(locs.u_speed, 0.5);
    gl.uniform1i(locs.u_curve_type, curve_type);
    gl.uniform1i(locs.u_max_points, MAX_POINTS);
    gl.uniform1f(locs.u_t_min, t_min);
    gl.uniform1f(locs.u_t_max, t_max);
    gl.uniform1f(locs.u_a_coef, a_coef);
    gl.uniform1f(locs.u_b_coef, b_coef);
    gl.uniform1f(locs.u_c_coef, c_coef);
    gl.uniform1f(locs.u_size, size);
    gl.uniform1f(locs.u_offsetX, offsetX);
    gl.uniform1f(locs.u_offsetY, offsetY);
}

function animate(timestamp) {
    window.requestAnimationFrame(animate);
    handles_animation(timestamp);
    setup_dynamic_graphic_interface();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    resize_window();

    send_uniforms();
    gl.bindVertexArray(vao);

    if (line_strip) gl.drawArrays(gl.LINE_STRIP, 0, MAX_POINTS);
    else gl.drawArrays(gl.POINTS, 0, MAX_POINTS);

    gl.bindVertexArray(null);
    gl.useProgram(null);
}

loadShadersFromURLS(["shader1.vert", "shader1.frag"]).then(shaders => setup(shaders));
