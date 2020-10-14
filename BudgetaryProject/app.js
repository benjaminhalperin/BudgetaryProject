//************************************************************************
//********************  BUDGETARY PROJECT DRILL  *************************
//************************************************************************

//******************************
// BUDGET CONTROLLER
//******************************
var budgetController = (function() {
	// building object constructor for Expense data for controller
	var Expense = function(id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
		this.percentage = -1;
	};
	
	Expense.prototype.calcPercentage = function(totalIncome) {
		if (totalIncome > 0) {
			this.percentage = Math.round((this.value / totalIncome) * 100);
		} else {
			this.percentage = -1;
		}
	};
	
	Expense.prototype.getPercentage = function() {
		return this.percentage;
	};
	
	// building object constructor for Income data for controller
	var Income = function(id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
	};
	
	// Lecture 86 "total of values" of action types for budget balance:
	var calculateTotal = function(type) {
		var sum = 0;
		data.allItems[type].forEach(function(cur) {
			sum += cur.value;     // it compatible to: sum=sum+cur.value
		});
		data.totals[type] = sum;
	};
	
	// to store all data: expenses, incomes and total balance in structure (array)
	var data = {
		allItems: {
			exp: [],
			inc: []
		},
		totals: {
			exp: 0,
			inc: 0
		},
		budget: 0,
		percentage: -1
	};

	// create new public FM to GET items
	return {
		addItem: function(type, des, val) {
			var newItem, ID;
			
			//[1 2 3 4 5], next ID = 6
			//[1 2 4 6 8], next ID = 9
			// ID = last ID + 1
			
			// create new ID
			if (data.allItems[type].length > 0) {
				ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
			} else {
				ID = 0;
			}
			
			// create new item based on 'inc' or 'exp'
			if (type === 'exp') {
				newItem = new Expense(ID, des, val);
			} else if (type === 'inc') {
				newItem = new Income(ID, des, val);
			}
			
			// Push it into our data structure
			data.allItems[type].push(newItem);
			
			// Return the new element
			return newItem;
		},
		
		// Lecture 91 - delete item FM begins here
		deleteItem: function(type, id) {
		var ids, index;
			
			// example: Delete element "6" from the array:
			// id = 6
			// data.allItems[type][id];
			// ids = [1 2 4 6 8]
			// index = 3
			
			var ids = data.allItems[type].map(function(current) {
				return current.id;
			});

			index = ids.indexOf(id);	
			
			if (index !== -1) {
				data.allItems[type].splice(index, 1);	
			}
		},
		
		
		// Lecture 86 issue begins here
		calculateBudget: function() {
			
			// calculate total income and expenses
			calculateTotal('exp');
			calculateTotal('inc');
			
			// calculate the budget: income - expenses
			data.budget = data.totals.inc - data.totals.exp;
			
			// calculate the percentage of income that we spent
			if (data.totals.inc > 0) {
				data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
			} else {
				data.percentage = -1;   // ensure no partition zero to avoid error calc
			}
					
			// Expense = 100 and income 300, spent 33.333% = 100/30 = 0.3333 * 100
		},
		
		calculatePercentages: function() {
			
			/* 
			a=20
			b=10
			c=40
			income = 100
			a=20/100=20%
			b=10/100=10%
			c=40/100=40%
			*/
			
			data.allItems.exp.forEach(function(cur) {
				cur.calcPercentage(data.totals.inc);
			});
		},
		
		getPercentages: function() {
			var allPerc = data.allItems.exp.map(function(cur) {
				return cur.getPercentage();
			});
			return allPerc;
		},
				
		getBudget: function() {
			return {
				budget: data.budget,
				totalInc: data.totals.inc,
				totalExp: data.totals.exp,
				percentage: data.percentage
			};
		},

		testing: function() {
			console.log(data);
		}
	};
		
})();
// End of budget controller FM


//******************************
// UI CONTROLLER
//******************************
var UIController = (function() {
	// making private object for UI uses: to avoid strings during program
	var DOMstrings = {
		inputType: '.add__type',
		inputDescription: '.add__description',
		inputValue: '.add__value',
		inputBtn: '.add__btn',
		incomeContainer: '.income__list',
		expensesContainer: '.expenses__list',
		budgetLabel: '.budget__value',
		incomeLabel: '.budget__income--value',
		expensesLabel: '.budget__expenses--value',
		percentageLabel: '.budget__expenses--percentage',
		container: '.container',
		expensesPercLabel: '.item__percentage',
		dateLabel: '.budget__title--month'
	};
	
	// Lecture 97: Text strings manipulation to integer numeric detailed display
		var formatNumber = function(num, type) {
			var numSplit, int, dec, type;
			/* The basic rules to display integer number:
			+ or - before number
			exactly 2 decimal points
			comma separating the thousands
			2310.4567 -> + 2,310.46
			2000 -> + 2,000.00
			*/
			
			// 1st - make any number to absolute value:
			num = Math.abs(num);
			num = num.toFixed(2);
			
			numSplit = num.split('.')
			
			int = numSplit[0];
			if (int.length > 3) {
				int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);  // 2nd: input 2310, output 2,310
			}
						
			dec = numSplit[1];
						
			return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;			
	};

	var nodeListForEach = function(list, callback) {
		for (var i = 0; i < list.length; i++) {
			callback(list[i], i);
		}
	};
		
	return {
		getInput: function() {   // class budget in the HTML
			return {
				type: document.querySelector(DOMstrings.inputType).value,  // type of: will be either inc or exp
				description: document.querySelector(DOMstrings.inputDescription).value,
				value: parseFloat(document.querySelector(DOMstrings.inputValue).value)  // convert string to a number by PARSE
			};
		},

		// Lecture 83 subject:
		addListItem: function(obj, type) {
			var html, newHtml, element;
			
			// Create HTML string with placeholder text	
			if (type === 'inc') {
				element = DOMstrings.incomeContainer;
				
				html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'; 
						 
			} else if (type === 'exp') {
				element = DOMstrings.expensesContainer;
				
				html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'; 
			}
						
			// Replace the placeholder text with some actual data
			newHtml = html.replace('%id%', obj.id);
			newHtml = newHtml.replace('%description%', obj.description);
			newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));
						
			// Insert the HTML into the DOM
			document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
		},
		
		// Start of lecture 92 begins here: method FM to delete from DOM
		deleteListItem:function(selectorID) {	
			var el = document.getElementById(selectorID);
			
			el.parentNode.removeChild(el);
		},
		
		// Start of lecture 84 subject - beginning of clear html input fields:
		clearFields: function() {
			var fields, fieldsArr;
			
			fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
			
			// Now we need to convert the receipted list to an array for deal with
			// Use of ARRAY declare - all inheritors of Array constructor are valid here
			fieldsArr = Array.prototype.slice.call(fields);
			
			fieldsArr.forEach(function(current, index, array) {
				
				current.value = "";	
			});
			
			// Set the focus of the first array element (visually GUI)
			fieldsArr[0].focus();
		},
		
		// Lecture 87 start
		displayBudget: function(obj) {
			var type;
			
			obj.budget > 0 ? type = 'inc' : type = 'exp';
			
			document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
			document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
			document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
			//document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage;
						
			if (obj.percentage > 0) {
				document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
			} else {
				document.querySelector(DOMstrings.percentageLabel).textContent = '---';
			} 
		},
		
		// Lecture 96: 
		displayPercentages: function(percentages) {			
			var fields = document.querySelectorAll(DOMstrings.expensesPercLabel); // create NodeList instead of array
						
			nodeListForEach(fields, function(current, index) {
				
				if (percentages[index] > 0){
					current.textContent = percentages[index] + '%';
				} else {
					current.textContent = '---';
				}
			});
		},
		
		// Lecture98: FM constructor for the date display
		displayMonth: function() {
			var now, months, month, year;
			
			now = new Date();
			months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
			month = now.getMonth();
			year = now.getFullYear();
			document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
		},

		// Lecture 99: FM change input event to TEXT BOXES red/blue outlines color
		changedType: function() {
			
			var fields = document.querySelectorAll(
				DOMstrings.inputType + ',' +
				DOMstrings.inputDescription + ',' +
				DOMstrings.inputValue);

			nodeListForEach(fields, function(cur) {
				cur.classList.toggle('red-focus');
			});
			
			// Lecture 99: FM change input event to the BUTTON control red outlines color
			document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
		},
		
		getDOMstrings: function() {
			return DOMstrings;
		}
	};
	
})();
// End of UI controller FM


//******************************
// GLOBAL APP CONTROLLER
//******************************
var controller = (function(budgetCtrl, UICtrl) {

	// create the INIT function setup
	var setupEventListeners =  function() {
		var DOM = UICtrl.getDOMstrings();

	// Making key press event
	//  https://developer.mozilla.org/en-US/docs/Web/Events מקור רפרנס לאירועים
		document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

		document.addEventListener('keypress', function(event) {
			if (event.keyCode === 13 || event.which === 13) {
				ctrlAddItem();
			}
		});
		
		// Lecture 90 subject beginning here: Put EventHandler
		document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
		
		// Lecture 99: Change color of frames input boxes in the UI
		document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
	};

	// Lecture 85 subject:
	var updateBudget = function() {
				
			// 1. Calculate the budget
			budgetCtrl.calculateBudget();
			
			// 2. Return the budget
			var budget = budgetCtrl.getBudget();
			
			// 3. display the budget on the UI
			UICtrl.displayBudget(budget);
	};

	// Lecture 94 start here update percentage
	var updatePercentages = function() {
		
		// 1. Calculate percentage
		budgetCtrl.calculatePercentages();
		
		// 2. Read percentages from the budget controller
		var percentages = budgetCtrl.getPercentages();
		
		// 3. Update the UI with the new percentages 
		UICtrl.displayPercentages(percentages);
	};


	var ctrlAddItem = function() {
			var input, newItem;
			
			// 1. Get the field input data
			input = UICtrl.getInput();
			
			// what to do in case no real input value in the input textbox - only real value in
			// if (input.description !== "" && !isNaN(input.Value) && input.Value > 0) { // ORIGINAL course code is not working!! maybe NaN

			if (input.description !== "" && input.value > 0 ) {
				// 2. Add the item to the budget controller
				newItem = budgetCtrl.addItem(input.type, input.description, input.value);
				
				// 3. Add the item to UI
				UICtrl.addListItem(newItem, input.type);
				
				// 4. Clear the fields
				UICtrl.clearFields();
		
				// 5. Calculate and update budget
				updateBudget();
				}
				
				// 6. Calculate and update percentages
				updatePercentages();
	};
	
	// Lecture 90: FM to handle any Click event
	var ctrlDeleteItem = function(event) {
		var itemID, splitID, type, ID;
		
		itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
		
		if(itemID){
			
			// inc-1
			splitID = itemID.split('-');
			type = splitID[0];
			ID = parseInt(splitID[1]);
			
			// 1. Delete the item from the data structure
			budgetCtrl.deleteItem(type, ID);
			
			// 2. Delete the item from the UI
			UICtrl.deleteListItem(itemID);
			
			// 3. Update and show the new budget
			updateBudget();
			
			// 4. Calculate and update percentages
			updatePercentages();
		}
	};

	// creation of the INIT public function to feed "0" in all variables in beginning Run
	return {
		init: function() {
			console.log('Application has started.');
			UICtrl.displayMonth();
			UICtrl.displayBudget({
				budget: 0,
				totalInc: 0,
				totalExp: 0,
				percentage: -1     
			});
			
			setupEventListeners();
		}
	};

})(budgetController, UIController);

controller.init();

// End of GLOBAL CONTROLLER FM