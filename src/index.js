

'use strict';

const Alexa = require('alexa-sdk');

const https = require('https');

const apiKey = "DEMO_KEY";

const reprompt = "Say NEXT, PREVIOUS or REPEAT";

const handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', "Say an address or zipcode to search for charging stations nearby");
    },
    'GetStationIntent': function () {

        httpsGet(this.event.request.intent.slots.Location.value,0,  (myResult) => {

                if(!myResult.total_results){
                    this.emit(':tell', 'Server busy, please try again later');
                    return;
                }
                if(parseInt(myResult.total_results)>0){
                    this.attributes.location = this.event.request.intent.slots.Location.value;
                    this.attributes.offset = 0;
                    var content = myResult.total_results+' stations found. Nearest is '+formatStation(myResult);
                    this.emit(':askWithCard', content, reprompt, 'Charging stations', content);
                }else
                    this.emit(':tell', 'Sorry, No stations found!');

            }
        );
    },
    'AMAZON.NextIntent': function () {
        if(!this.attributes.location){
            this.emit(':ask', "Say an address or zipcode to search for charging stations nearby");
            return;
        }
        var offset = parseInt(this.attributes.offset)+1;
        httpsGet(this.attributes.location, offset,  (myResult) => {

                if(!myResult.total_results){
                    this.emit(':tell', 'Server busy, please try again later');
                    return;
                }
                if(myResult.fuel_stations.length>0){
                    this.attributes.offset = offset;
                    var content = formatStation(myResult);
                    this.emit(':askWithCard', content, reprompt, 'Charging stations', content);
                }else
                    this.emit(':ask', 'No more stations found!');

            }
        );
    },
    'AMAZON.PreviousIntent': function () {
        if(!this.attributes.location){
            this.emit(':ask', "Say an address or zipcode to search for charging stations nearby");
            return;
        }
        var offset = parseInt(this.attributes.offset)-1;
        if(offset<0){
            this.emit(':ask', "This is the nearest station. Say Next to look for farther stations");
            return;
        }
        httpsGet(this.attributes.location, offset,  (myResult) => {

                if(!myResult.total_results){
                    this.emit(':tell', 'Server busy, please try again later');
                    return;
                }
                if(myResult.fuel_stations.length>0){
                    this.attributes.offset = offset;
                    var content = formatStation(myResult);
                    this.emit(':askWithCard', content, reprompt, 'Charging stations', content);
                }else
                    this.emit(':ask', 'No more stations found!');

            }
        );
    },
    'AMAZON.RepeatIntent': function () {
        if(!this.attributes.location){
            this.emit(':ask', "Say an address or zipcode to search for charging stations nearby");
            return;
        }
        var offset = parseInt(this.attributes.offset);
        httpsGet(this.attributes.location, offset,  (myResult) => {

                if(!myResult.total_results){
                    this.emit(':tell', 'Server busy, please try again later');
                    return;
                }
                if(myResult.fuel_stations.length>0){
                    this.attributes.offset = offset;
                    var content = formatStation(myResult);
                    this.emit(':askWithCard', content, reprompt, 'Charging stations', content);
                }else
                    this.emit(':ask', 'No stations found!');

            }
        );
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', 'Say an address or zipcode to search for charging stations nearby. You can then say NEXT, PREVIOUS or REPEAT to browse through the available stations');
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'Thank you for going green!');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', 'Thank you for going green!');
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', 'Thank you for going green!');
    },
};

function formatStation(myResult){
    return myResult.fuel_stations[0].station_name+', at '+myResult.fuel_stations[0].street_address+', '+myResult.fuel_stations[0].city;
}

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    //alexa.APP_ID = APP_ID;

    alexa.registerHandlers(handlers);
    alexa.execute();
};

function httpsGet(location, offset, callback) {

    var options = {
        host: 'developer.nrel.gov',
        path: '/api/alt-fuel-stations/v1/nearest.json?api_key='+apiKey+'&location='+encodeURIComponent(location)+'&fuel_type=ELEC&status=E&access=public&limit=1&offset='+offset,
        method: 'GET',

    };

    var req = https.request(options, res => {
        res.setEncoding('utf8');
        var returnData = "";

        res.on('data', chunk => {
            returnData = returnData + chunk;
        });

        res.on('end', () => {


            var pop = JSON.parse(returnData);

            callback(pop); 

        });

    });
    req.end();

}
