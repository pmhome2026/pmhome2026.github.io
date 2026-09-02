/*
V4 Auth Extension
*/

function getCurrentUser(){
    return localStorage.getItem("pm_user");
}

function requireLogin(){
    if(!getCurrentUser()){
        window.location.href="login.html";
    }
}

function getUserRole(){
    return localStorage.getItem("pm_role") || "";
}
