function checkResourcePermission(resourceId, username, aclData){

    const resource = aclData.resources.find(
        item => item.resource_id === resourceId
    );

    if(!resource){
        return null;
    }

    const permission = resource.permissions.find(
        item => item.username === username
    );

    return permission ? permission.permission : null;
}
