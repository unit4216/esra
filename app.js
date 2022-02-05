//init dependencies
var express = require('express');
var app = express();
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');

//assign html from index.html to variable
var index = fs.readFileSync('index.html');

//open connection to db
let db = new sqlite3.Database('oil.db');

//generate datelist for use in filtering data from DB
var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var years = []
var datelist=[];

for (let a=1980; a < 2022; a++){
    years.push(a.toString().slice(-2)); //only push last two digits of year
}

for(let i=0; i<years.length; i++){
    for(let z=0; z<months.length; z++){
        datelist.push(months[z] + '-' + years[i]);
    }
}

/////////////////
//// ROUTING ////
/////////////////

app.listen(3000, () => {
    console.log('Server running on port 3000');
})

app.get('/', (req, res, next) => {
    res.end(index); //must use .end to send HTML without downloading it
});

//gets data from specified name and daterange
app.get('/api/daterange', (req, res, next) => {

    //wrap function in try/catch for add'l error handling, returns 400 Bad Request
    try{
    
    var name = req.query.name;
    var start = req.query.start;
    var end = req.query.end;

    //catches bad date format errors and returns 400 code
    if(start.length!=6 | end.length != 6){
        res.end('400 Bad Request');
        return;
    }

    //convert user input dates to same format as datelist (e.g. from 012001 to Jan-01)
    start=months[parseInt(start.slice(0,2))-1]+'-'+start.slice(-2)
    end=months[parseInt(end.slice(0,2))-1]+'-'+end.slice(-2)

    //get indexes of start and end date in master datelist
    startIndex=datelist.indexOf(start);
    endIndex=datelist.indexOf(end)+1;

    //slice master datelist into sublist and then do add'l formatting so that the sublist can be used via an IN command to select data from db
    mod_datelist = datelist.slice(startIndex,endIndex);
    mod_datelist = mod_datelist.map(x => "'"+x+"'");
    mod_datelist = '(' + mod_datelist + ')'

    var output=[];

    command = "SELECT * FROM " + name + " WHERE Month IN " + mod_datelist

    //select data from db using mod_datelist as filter
    db.all(command,[],(err, rows ) => {
        if (err) {                          //error handling - bad SQL requests will return 400 code and return w/o crashing server.
            console.log(err);
            res.end('400 Bad Request');
            return}
            rows.forEach((row) => {
                output.push(row);
            }); 
            
            //check if data is empty (invalid request)
            if(output.length===0){
                res.end('Invalid request: No data available for that daterange.');
            }
            
            //if data not empty (valid request), send as response
            else {
                output = JSON.stringify(output, null, 2); //pretty-print JSON

                res.end(output) // have to use .end instead of .send to pretty-print JSON
            };
    });

    } catch(error){
        res.end('400 Bad Request')
    }


    
});

//get ALL data
app.get('/api/all', (req, res, next) => {

    tables_list=['cushing_1','cushing_2','cushing_3','harbor_1','harbor_2','harbor_3'];

    var cushing_1=[];
    var cushing_2=[];
    var cushing_3=[];
    var harbor_1=[];
    var harbor_2=[];
    var harbor_3=[];

    output={
        'cushing_1':cushing_1,
        'cushing_2':cushing_2,
        'cushing_3':cushing_3,
        'harbor_1':harbor_1,
        'harbor_2':harbor_2,
        'harbor_3':harbor_3,
    }

    //pulls data from DBs.
    //callback functions required, otherwise response sends before it's populated
    db.all('SELECT * FROM cushing_1',[],(err, rows ) => {
        if (err) {throw err;}
            rows.forEach((row) => {cushing_1.push(row);}); 

            db.all('SELECT * FROM cushing_2',[],(err, rows ) => {
                if (err) {throw err;}
                    rows.forEach((row) => {cushing_2.push(row);}); 

                    db.all('SELECT * FROM cushing_3',[],(err, rows ) => {
                        if (err) {throw err;}
                            rows.forEach((row) => {cushing_3.push(row);}); 

                            db.all('SELECT * FROM harbor_1',[],(err, rows ) => {
                                if (err) {throw err;}
                                    rows.forEach((row) => {harbor_1.push(row);}); 

                                    db.all('SELECT * FROM harbor_2',[],(err, rows ) => {
                                        if (err) {throw err;}
                                            rows.forEach((row) => {harbor_2.push(row);}); 

                                            db.all('SELECT * FROM harbor_3',[],(err, rows ) => {
                                                if (err) {throw err;}
                                                    rows.forEach((row) => {harbor_3.push(row);}); 

                                                    output = JSON.stringify(output, null, 2); //pretty-print JSON

                                                    res.end(output) // have to use .end instead of .send to pretty-print JSON

                                            });
                                    });
                            });
                    });
            });
    });

    
    
    

    

    

    


})