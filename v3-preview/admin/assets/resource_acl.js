function getResourcePermission(resourceId, username, aclData){
    const resource = aclData.resources.find(item=>item.resource_id===resourceId);
    if(!resource) return null;
    const permission = resource.permissions.find(item=>item.username===username);
    return permission ? permission.permission : null;
}

function canReadResource(resourceId, username, aclData){
    return ["READ","DOWNLOAD","EDIT","ADMIN"].includes(
        getResourcePermission(resourceId,username,aclData)
    );
}
