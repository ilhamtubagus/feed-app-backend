const init = require('./loaders/index');
const dotenv = require('dotenv');
dotenv.config();

async function startServer (){
    await init((app, connection) => {
        const port = 8080 || process.env.PORT;
        app.listen(port, err => {
            if (err) {
                console.log(err);
                return;
            }
            console.log(`server is running on port ${port}`);
        });
    });
    
}
startServer();