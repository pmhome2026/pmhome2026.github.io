/*
 V4 Access Permission Resolver
*/

function resolvePermission(context){

    if(!context.deviceAllowed){
        return {
            allow:false,
            reason:"DEVICE_NOT_AUTHORIZED"
        };
    }

    if(!context.planAllowed){
        return {
            allow:false,
            reason:"PLAN_DENIED"
        };
    }

    if(!context.roleAllowed){
        return {
            allow:false,
            reason:"ROLE_DENIED"
        };
    }

    if(!context.resourceAllowed){
        return {
            allow:false,
            reason:"RESOURCE_ACL_DENIED"
        };
    }

    return {
        allow:true,
        reason:"ALL_CHECK_PASS"
    };
}
