# EDBS

This is a software to be used to make backup requests, and uploads easier. 
Made by Erdem Sezen in summer internship at ENKA.

Currently supported features:
    - Create backup requests<br/>
    - Upload backup files<br/>
    - Create periodic requests<br/>
    - Download backup files<br/>
    - Delete Backup requests<br/>
    - Automatically mark not completed requests

Not implemented features: 
    - Backup file confirmation upon upload<br/>
    - Searching and filters for tables<br/>
    - User creation UI<br/>
    - Automatic table refresh<br/>
    - Automatic server location fill in "Make Request"

Currently software only works on a local MySQL Database. ".env" file can be
filled in as shown in the template. Make sure to choose a secure key for JSON 
Web Tokens as they are crucial for security. Initialization query for tables
are given in the "db-init.sql" file. Simply run this file in your DB to create
necessary tables or edit the code according to your needs.

When using the app sometimes changes made will not be shown in tables. If this
occurs simply refresh the web page. Also for make requests server locations 
have to be manually added. Since there are a limited number of server locations,
doing this once will enough. 

To start it simply install packages in package.json using npm. Then run "npm start"

For further questons mail me at: erdem.sezen@ozu.edu.tr

Last Edited at: 2024-07-29 16:28:42