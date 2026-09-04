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

    if(
        !admin ||
        admin.role!=="Admin" ||
        admin.provider!=="github"
    ){
        alert("无管理员权限，请使用 GitHub 登录");
        window.location.href="login.html";
        return false;
    }

    return true;
}
