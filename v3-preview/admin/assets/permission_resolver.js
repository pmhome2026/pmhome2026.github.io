/*
V4 Permission Resolver
*/

function checkAccess(context){

    if(!context.deviceAllowed){
        return false;
    }

    if(!context.planAllowed){
        return false;
    }

    if(!context.roleAllowed){
        return false;
    }

    if(!context.resourceAllowed){
        return false;
    }

    return true;
}

function getAccessResult(context){
    return {
        allowed: checkAccess(context),
        reason: checkAccess(context) ? "ALLOW" : "DENY"
    };
}
