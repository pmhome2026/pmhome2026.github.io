function checkResourcePermission(resourceId, username, aclData){
    const resource = aclData.resources.find(
        item => item.resource_id === resourceId
    );

    if(!resource){
        return false;
    }

    return resource.permissions.some(
        item => item.username === username
    );
}
