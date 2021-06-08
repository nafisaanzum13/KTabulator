To start the application: npm start

Most of the code (and most of the functions) are written in src/components/MainBody.jsx.

The code that corresponds to the table are in src/components/TablePanel.jsx

The code that corresponds to the Action Panel (the part on the right of the table) are in src/components/ActionPanel.jsx.

Generally, to add a new feature to the application:
  -First create a new HTML element in the corresponding jsx file. (for example: a button in TablePanel.jsx. We want something to happen when we click on this       button)
   -Then, write the corresponding function that we want to run when the button is clicked in MainBody.jsx. Then pass this function as an onClick function to the corresponding component, say for example, TablePanel.
   
Sometimes there is an additional layer (when we click on something in the TablePanel, some function is run. This function causes some elements to be rendered in ActionPanel first. Then we click on something in the ActionPanel)
   
I will illustrate all these using an example. Suppose we want to sort a column.First we click on the filter icon that is located on a column’s header. (the corresponding HTML element is in line 223-229 in TablePanel.jsx)
When we click on this icon, function showFilterMethods is run (passed from MainBody.jsx to TablePanel.jsx in line 5546 of MainBody.jsx)

This function is written in MainBody.jsx, see line 2941 to 2961 of MainBody.jsx.
Note that this function sets the state variable called curActionInfo (line 2957). This state variableis passed to ActionPanel.jsx, and used by ActionPanel.jsx to determine what will be displayed in Action Panel.

In this case, curActionInfo passed stores “showFilterMethods” (line 2953). ActionPanel receives this information, and renders the corresponding HTML elements, a list of buttons. (see line 651 to 723 in ActionPanel.jsx) In this case, we want to sort the column, so we would click the corresponding button. (line 677). Then function contextSortColumn is run. 
contextSortColumn is passed from MainBody.jsx to ActionPanel.jsx. It is written in line 2782 of MainBody.jsx.

Note that at the end of this function, (line 2878), the state variable tableData is changed. This state variable stores information used to create the table, and is passed to TablePanel.jsx.Since tableData controls what is displayed in the table, when this variable is changed, table is correctly sorted. This is all. 
