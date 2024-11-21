*Project Overview*
This application allows users to upload datasets via file uploads or Google Drive links. It processes the data, stores it in a database, and displays the results interactively on a dashboard. Users can analyze the data and download query results as a CSV file.  

*Tools and Technologies*  
1. *Frontend*: JavaScript, HTML5, CSS3  
2. *Backend*: Flask  
3. *APIs*: Google Drive API (to fetch shared files)  
4. *Query Processing*: Groq  
5. *File Handling*: Supports JSON, CSV, and other structured data formats  


*Third-Party APIs and Tools*
1. *Google Drive API*
Enables fetching files shared via Google Drive links.
2. *Groq*
Facilitates efficient query processing on structured data.
3. *Flask*
Lightweight Python framework for building web applications.


*Usage Guide*
1. *Uploading Datasets*
Choose between file upload or pasting a Google Drive link.
Click "Upload" to send the data for processing.

2. *Processing Data*
The uploaded dataset is processed automatically.
Data is stored in a folder for query execution.

3. *Running Queries*
Use the dashboard interface to input queries.
View results on the screen.
Download the query results as a CSV file.