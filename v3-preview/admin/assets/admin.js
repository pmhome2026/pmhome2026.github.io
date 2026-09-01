document.addEventListener(
"DOMContentLoaded",
function(){


console.log(
"PM Knowledge Admin initialized"
);



fetch("../api/status.json")

.then(
response=>response.json()
)

.then(
data=>{


console.log(
"System Status:",
data
);


})


.catch(
error=>{


console.error(
"API loading failed",
error
);


});


});
