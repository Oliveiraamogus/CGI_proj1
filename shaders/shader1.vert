#version 300 es

//precision mediump float;
in uint a_index;
uniform int u_max_points;
uniform int u_curve_type;
uniform float u_t_min;
uniform float u_t_max;
uniform float u_a_coef;
uniform float u_b_coef;
uniform float u_c_coef;
uniform float u_dimensions;
/*uniform float u_x_ratio;
uniform float u_y_ratio;*/

void main() {

    float t = (float(a_index) / float(u_max_points)) * u_t_max;
    float x, y;
    float a = u_a_coef;
    float b = u_b_coef;
    float c = u_c_coef;
    float e = 2.718281828459045f;
    switch(u_curve_type) {
        case 1:
            x = cos(a * t) + cos(b * t) / 2.0f + sin(c * t) / 3.0f;
            y = sin(a * t) + sin(b * t) / 2.0f + cos(c * t) / 3.0f;
            break;
        case 2:
            x = 2.0f * (cos(a * t) + pow(cos(b * t), 3.0f));
            y = 2.0f * (sin(a * t) + pow(sin(b * t), 3.0f));
            break;
        case 3:
            x = cos(a * t) * sin(sin(a * t));
            y = sin(a * t) * cos(cos(b * t));
            break;
        case 4:
            x = cos(a * t) * cos(b * t);
            y = sin(cos(a * t));
            break;
        case 5:
            x = sin(a * t) * (pow(e, cos(a * t)) - 2.0f * cos(b * t));
            y = cos(a * t) * (pow(e, cos(a * t)) - 2.0f * cos(b * t));
            break;
        case 6:
            x = (a - b) * cos(b * t) + cos((a * t) - (b * t));
            y = (a - b) * sin(b * t) - sin((a * t) - (b * t));
            break;
    }
    x /= u_dimensions;
    gl_Position = vec4(x, y, 0.0f, 1.0f);
    gl_PointSize = 5.0f;
}