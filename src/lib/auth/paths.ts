// One source of truth for where each role lands and logs in. Routes, pages and
// (later) src/proxy.ts all read these so they can't drift apart.
export const ADMIN_LOGIN = "/login";
export const ADMIN_HOME = "/dashboard";
export const FARMER_LOGIN = "/farmer/login";
export const FARMER_SIGNUP = "/farmer/signup";
export const FARMER_HOME = "/farmer/dashboard";
