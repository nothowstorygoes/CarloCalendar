const fs = require('fs');
const ical = require('node-ical');

fs.readFile('path/to/yourfile.ics', 'utf8', (err, data) => {
    if (err) throw err;
    const parsedData = ical.parseICS(data);
    parsedEvents = [];
    counter = 0;

    for (const key in parsedData) {
        const event = parsedData[key];
        if (event.type === 'VEVENT') {
            parsedEvents.push({
                id: counter++,
                title: event.summary,
                description: event.description,
                day: event.start,
                time: event.start,
                end: event.end,
                label: "Work",
                checked: false,

            }
                event);
           
        }
    }
});

// stallo serve codifica utilizzata da carlo e capire come recuperare i tasks