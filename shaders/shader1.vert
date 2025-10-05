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
    //vec2 p = vec2(cos(a_index) * 0.5f, sin(a_index) * 0.5f);
    //gl_Position = vec4(cos((float) a_index ) * 0.5f, sin (float) a_index ) * 0.5f, 0.0f, 1.0f);
    /*if (u_curve_type == 1) {

        gl_Position = vec4(cos(float(a_index)) * 0.5f, sin(float(a_index)) * 0.5f, 0.0f, 1.0f);
        gl_PointSize = 5.0f;
    }*/

    float t = (float(a_index) / float(u_max_points)) * u_t_max;
    float x;
    float y;
    float e = 2.718281828459045f;
    switch(u_curve_type) {
        case 1:
            x = cos(u_a_coef * t) + cos(u_b_coef * t) / 2.0f + sin(u_c_coef * t) / 3.0f;
            y = cos(u_a_coef * t) + cos(u_b_coef * t) / 2.0f + sin(u_c_coef * t) / 3.0f;
            break;
        case 2:
            x = (cos(u_a_coef * t) + (cos(u_b_coef * t) * cos(u_b_coef * t) * cos(u_b_coef * t))) * 2.0f;
            y = (sin(u_a_coef * t) + (sin(u_b_coef * t) * sin(u_b_coef * t) * sin(u_b_coef * t))) * 2.0f;
            break;
        case 3:
            x = cos(u_a_coef * t) * sin(sin(u_a_coef * t));
            y = sin(u_a_coef * t) * cos(cos(u_b_coef * t));
            break;
        case 4:
            x = cos(u_a_coef * t) * cos(u_b_coef * t);
            y = sin(cos(u_a_coef * t));
            break;
        case 5:
            x = sin(u_a_coef * t) * (pow(e, cos(u_a_coef * t)) - 2.0f * cos(u_b_coef * t));
            y = cos(u_a_coef * t) * (pow(e, cos(u_a_coef * t)) - 2.0f * cos(u_b_coef * t));
            break;
        case 6:
            x = (u_a_coef - u_b_coef) * cos(u_b_coef * t) + cos((u_a_coef * t) - (u_b_coef * t));
            y = (u_a_coef - u_b_coef) * sin(u_b_coef * t) - sin((u_a_coef * t) - (u_b_coef * t));
            break;
    }
    /*x = x * u_x_ratio;
    y = y * u_y_ratio;*/
    x /= u_dimensions;
    gl_Position = vec4(x, y, 0.0f, 1.0f);
    gl_PointSize = 5.0f;
}