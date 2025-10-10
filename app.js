import { loadShadersFromURLS, buildProgramFromSources, setupWebGL } from "../../libs/utils.js";

const INC_SPEED = 0.5;
const VARIATION = 0.01;
const LOCS = {};
const ZOOM1 = 2.50;
const ZOOM2 = 4.50;
const ZOOM3 = 1.00;
const ZOOM4 = 1.00;
const ZOOM5 = 3.50;
const ZOOM6 = 6.00;
const SPEED_FACTOR1 = 0.002;
const SPEED_FACTOR2 = 0.0008;
const SPEED_FACTOR3 = 0.0001;
const SPEED_FACTOR4 = 0.001;
const SPEED_FACTOR5 = 0.0009;
const SPEED_FACTOR6 = 0.002;

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
let zoom = 2.50;
let offsetX = 0.00;
let offsetY = 0.00;
let x = 0.00;
let y = 0.00;
let allowed = false;
let earlyX, earlyY;
let resetting = false;
let reset_targets = { a: 0, b: 0, c: 0, tmax: 0 };

function handle_u_locs() {
    const names = [
        "u_now", "u_speed", "u_curve_type", "u_max_points",
        "u_t_min", "u_t_max", "u_a_coef", "u_b_coef", "u_c_coef",
        "u_size", "u_offsetX", "u_offsetY", "u_dimensions"
    ];
    names.forEach(i => LOCS[i] = gl.getUniformLocation(program, i));
}

function resize(target) {
    const width = target.innerWidth;
    const height = target.innerHeight;

    canvas.width = width;
    canvas.height = height;

    gl.aspect = true;
    gl.viewport(0, 0, width, height);
}

function get_default_values(curve_id) {
    switch (curve_id) {
        case 1:
            return {
                a: 1.0, b: 1.0, c: 0.0, tmin: 0, tmax: Math.PI * 2
            };
        case 2:
            return {
                a: 1.0, b: 17.0, c: 0.0, tmin: 0, tmax: Math.PI * 2
            };
        case 3:
            return {
                a: 1.0, b: 8.6, c: 0.0, tmin: 0, tmax: Math.PI * 10
            };
        case 4:
            return {
                a: 7.6, b: 5.1, c: 0.0, tmin: 0, tmax: 10
            };
        case 5:
            return {
                a: 1.0, b: 4.0, c: 0.0, tmin: 0, tmax: 10
            };
        case 6:
            return {
                a: 4.0, b: 1.0, c: 0.0, tmin: 0, tmax: Math.PI * 2
            }
    }
}

function get_default_zoom(curve_id) {
    switch (curve_id) {
        case 1:
            return ZOOM1;
        case 2:
            return ZOOM2;
        case 3:
            return ZOOM3;
        case 4:
            return ZOOM4;
        case 5:
            return ZOOM5;
        case 6:
            return ZOOM6;
    }
}

function reset_defaults(curve_id) {
    a_coef = get_default_values(curve_id).a;
    b_coef = get_default_values(curve_id).b;
    c_coef = get_default_values(curve_id).c;
    t_min = get_default_values(curve_id).tmin;
    t_max = get_default_values(curve_id).tmax;
    zoom = get_default_zoom(curve_id);
    offsetX = 0.00;
    offsetY = 0.00;
    x = 0.00;
    y = 0.00;
}

// Handles all the mouse interactions
function handle_mouse_events() {
    // Handles zooming and general wheel interactions
    document.addEventListener('wheel', function (event) {
        zoom += (event.deltaY / 750);
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
                resetting = true;
                const def_values = get_default_values(curve_type);
                reset_targets.a = def_values.a;
                reset_targets.b = def_values.b;
                reset_targets.c = def_values.c;
                reset_targets.tmax = def_values.tmax;
                if (is_animating) is_animating = false;
                break;
            case "1": // Number 1: Curve's Family 1
                if (curve_type != 1) {
                    curve_type = 1;
                    reset_defaults(curve_type);
                }
                break;
            case "2": // Number 2: Curve's Family 2
                if (curve_type != 2) {
                    curve_type = 2;
                    reset_defaults(curve_type);
                }
                break;
            case "3": // Number 3: Curve's Family 3
                if (curve_type != 3) {
                    curve_type = 3;
                    reset_defaults(curve_type);
                }
                break;
            case "4": // Number 4: Curve's Family 4
                if (curve_type != 4) {
                    curve_type = 4;
                    reset_defaults(curve_type);
                }
                break;
            case "5": // Number 5: Curve's Family 5
                if (curve_type != 5) {
                    curve_type = 5;
                    reset_defaults(curve_type);
                }
                break;
            case "6": // Number 6: Curve's Family 6
                if (curve_type != 6) {
                    curve_type = 6;
                    reset_defaults(curve_type);
                }
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
                if (is_animating) is_animating = false;
                switch (current_coef) {
                    case 'a':
                        a_coef += VARIATION;
                        break;
                    case 'b':
                        b_coef += VARIATION;
                        break;
                    case 'c':
                        c_coef += VARIATION;
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
                        a_coef -= VARIATION;
                        break;
                    case 'b':
                        b_coef -= VARIATION;
                        break;
                    case 'c':
                        c_coef -= VARIATION;
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

function handles_animation(timestamp) {
    if (previous_timestamp == null) previous_timestamp = timestamp;

    let animation_speed;

    switch (curve_type) {
        case 1:
            animation_speed = (timestamp - previous_timestamp) * SPEED_FACTOR1;
            break;
        case 2:
            animation_speed = (timestamp - previous_timestamp) * SPEED_FACTOR2;
            break;
        case 3:
            animation_speed = (timestamp - previous_timestamp) * SPEED_FACTOR3;
            break;
        case 4:
            animation_speed = (timestamp - previous_timestamp) * SPEED_FACTOR4;
            break;
        case 5:
            animation_speed = (timestamp - previous_timestamp) * SPEED_FACTOR5;
            break;
        case 6:
            animation_speed = (timestamp - previous_timestamp) * SPEED_FACTOR6;
            break;
    }

    previous_timestamp = timestamp;

    if (is_animating) {
        switch (current_coef) {
            case 'a':
                a_coef += animation_speed * INC_SPEED;
                break;
            case 'b':
                b_coef += animation_speed * INC_SPEED;
                break;
            case 'c':
                c_coef += animation_speed * INC_SPEED;
                break;
        }
    }

    if (resetting) {
        const reset_speed = animation_speed * 2.50;

        if (a_coef > reset_targets.a)
            a_coef = Math.max(reset_targets.a, a_coef - reset_speed);
        else if (a_coef < reset_targets.a)
            a_coef = Math.min(reset_targets.a, a_coef + reset_speed);

        if (b_coef > reset_targets.b)
            b_coef = Math.max(reset_targets.b, b_coef - reset_speed);
        else if (b_coef < reset_targets.b)
            b_coef = Math.min(reset_targets.b, b_coef + reset_speed);

        if (c_coef > reset_targets.c)
            c_coef = Math.max(reset_targets.c, c_coef - reset_speed);
        else if (c_coef < reset_targets.c)
            c_coef = Math.min(reset_targets.c, c_coef + reset_speed);

        if (t_max > reset_targets.tmax)
            t_max = Math.max(reset_targets.tmax, t_max - reset_speed);
        else if (a_coef < reset_targets.tmax)
            t_max = Math.min(reset_targets.tmax, t_max + reset_speed);

        if (a_coef == reset_targets.a && b_coef == reset_targets.b &&
            c_coef == reset_targets.c && t_max == reset_targets.tmax)
            resetting = false;
    }
}

function send_uniforms() {
    gl.uniform1f(LOCS.u_now, performance.now() * 0.001);
    gl.uniform1f(LOCS.u_speed, 0.5);
    gl.uniform1i(LOCS.u_curve_type, curve_type);
    gl.uniform1i(LOCS.u_max_points, MAX_POINTS);
    gl.uniform1f(LOCS.u_t_min, t_min);
    gl.uniform1f(LOCS.u_t_max, t_max);
    gl.uniform1f(LOCS.u_a_coef, a_coef);
    gl.uniform1f(LOCS.u_b_coef, b_coef);
    gl.uniform1f(LOCS.u_c_coef, c_coef);
    gl.uniform1f(LOCS.u_size, zoom);
    gl.uniform1f(LOCS.u_offsetX, offsetX);
    gl.uniform1f(LOCS.u_offsetY, offsetY);
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
