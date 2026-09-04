function getAdminSession(){
    try{
        return JSON.parse(
            localStorage.getItem("admin_session") || "null"
        );
    }catch(e){
        return null;
    }
}

function requireAdmin(){

    const admin=getAdminSession();

    if(!admin || admin.role!=="Admin"){
        alert("无管理员权限，请先登录");
        window.location.href="login.html";
    }
}
