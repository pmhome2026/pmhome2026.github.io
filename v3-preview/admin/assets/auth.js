function getCurrentUser(){
    return localStorage.getItem("pm_user");
}

function requireLogin(){
    if(!getCurrentUser()){
        window.location.href="login.html";
    }
}
