// TODO: need to break this into modules rather than one long file
    
        // TODO: do we need to hide the links to the page?
        // private key stuff - check into this
        // write up a blog post about this procedure - reference other websites:
        // https://coderwall.com/p/duapqq/use-a-google-spreadsheet-as-your-json-backend
        // https://stackoverflow.com/questions/24531351/retrieve-google-spreadsheet-worksheet-json
        const studyLink = 'https://spreadsheets.google.com/feeds/list/1PMWsPEfHFC6myMwhdidyr2hhRK5ZA-JrDQzwRoDTFaw/oua1i2d/public/values?alt=json-in-script&callback=text';
        const buildLink = 'https://spreadsheets.google.com/feeds/list/1PMWsPEfHFC6myMwhdidyr2hhRK5ZA-JrDQzwRoDTFaw/oua1i2d/public/values?alt=json-in-script&callback=text';
        
        // Getting the side nav buttons.
        const html_css_button = document.getElementById("HTML&CSS_Tab");
        const js_button = document.getElementById("Javascript_Tab");
        const react_button = document.getElementById("React_Tab");

        // Getting the side nav mobile icon buttons
        const course_icons = document.querySelectorAll(".mobile-icons");

        const full_time = document.getElementById("full-time-wrapper");
        const part_time = document.getElementById("part-time-wrapper");

        // Creating new Div elements.
        const html_full_new_el = document.createElement("DIV");
        const html_part_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");

        // Giving the new div elements ids.
        html_full_new_el.setAttribute("ID", "html_full_time_Contents");
        html_part_new_el.setAttribute("ID", "html_part_time_Contents");
        js_full_new_el.setAttribute("ID", "js_full_time_Contents");
        js_part_new_el.setAttribute("ID", "js_part_time_Contents");
        react_full_new_el.setAttribute("ID", "react_full_time_Contents");
        react_part_new_el.setAttribute("ID", "react_part_time_Contents");
        // Attaching those ids to the newly created div elements.
        full_time.appendChild(html_full_new_el);
        part_time.appendChild(html_part_new_el);
        full_time.appendChild(js_full_new_el);
        part_time.appendChild(js_part_new_el);
        full_time.appendChild(react_full_new_el);
        part_time.appendChild(react_part_new_el);
        
        // These variables are what separates the course boxes.
        const studySelectorHTML_Full = document.getElementById('html_full_time_Contents');
        const studySelectorHTML_Part = document.getElementById('html_part_time_Contents');
        const studySelectorJS_Full = document.getElementById('js_full_time_Contents');
        const studySelectorJS_Part = document.getElementById('js_part_time_Contents');
        const studySelectorReact_Full = document.getElementById('react_full_time_Contents');
        const studySelectorReact_Part = document.getElementById('react_part_time_Contents');
        
        const buildSelector = document.querySelector('#build-groups');
    
        const htmlFull12am = ['HTML & CSS - Full Time - 12AM'];
        const htmlFull6am = ['HTML & CSS - Full Time - 6AM'];
        const htmlFull12pm = ['HTML & CSS - Full Time - 12PM'];
        const htmlFull6pm = ['HTML & CSS - Full Time - 6PM'];
        const htmlPart12am = ['HTML & CSS - Part Time - 12AM'];
        const htmlPart6am = ['HTML & CSS - Part Time - 6AM'];
        const htmlPart12pm = ['HTML & CSS - Part Time - 12PM'];
        const htmlPart6pm = ['HTML & CSS - Part Time - 6PM'];
        
        const jsFull12am = ['JavaScript - Full Time - 12AM'];
        const jsFull6am = ['JavaScript - Full Time - 6AM'];
        const jsFull12pm = ['JavaScript - Full Time - 12PM'];
        const jsFull6pm = ['JavaScript - Full Time - 6PM'];
        const jsPart12am = ['JavaScript - Part Time - 12AM'];
        const jsPart6am = ['JavaScript - Part Time - 6AM'];
        const jsPart12pm = ['JavaScript - Part Time - 12PM'];
        const jsPart6pm = ['JavaScript - Part Time - 6PM'];
    
        const reactFull12am = ['React - Full Time - 12AM'];
        const reactFull6am = ['React - Full Time - 6AM'];
        const reactFull12pm = ['React - Full Time - 12PM'];
        const reactFull6pm = ['React - Full Time - 6PM'];
        const reactPart12am = ['React - Part Time - 12AM'];
        const reactPart6am = ['React - Part Time - 6AM'];
        const reactPart12pm = ['React - Part Time - 12PM'];
        const reactPart6pm = ['React - Part Time - 6PM'];
        
        /* The functions for showing the corresponding course boxes on button clicks */
        const showHtmlBoxes = () => {
          full_time.style.display = "block";
          part_time.style.display = "block";
          studySelectorHTML_Full.style.display = "block";
          studySelectorHTML_Part.style.display = "block";
          studySelectorJS_Full.style.display = "none";
          studySelectorJS_Part.style.display = "none";
          studySelectorReact_Full.style.display = "none";
          studySelectorReact_Part.style.display = "none";
        }
        html_css_button.addEventListener("click", showHtmlBoxes, false);

        const showJsBoxes = () => {
          full_time.style.display = "block";
          part_time.style.display = "block";
          studySelectorHTML_Full.style.display = "none";
          studySelectorHTML_Part.style.display = "none";
          studySelectorJS_Full.style.display = "block";
          studySelectorJS_Part.style.display = "block";
          studySelectorReact_Full.style.display = "none";
          studySelectorReact_Part.style.display = "none";
        }
        js_button.addEventListener("click", showJsBoxes, false);

        const showReactBoxes = () => {
          full_time.style.display = "block";
          part_time.style.display = "block";
          studySelectorHTML_Full.style.display = "none";
          studySelectorHTML_Part.style.display = "none";
          studySelectorJS_Full.style.display = "none";
          studySelectorJS_Part.style.display = "none";
          studySelectorReact_Full.style.display = "block";
          studySelectorReact_Part.style.display = "block";
        }
        react_button.addEventListener("click", showReactBoxes, false);

        // Course icons event listeners
        course_icons[0].addEventListener("click", showHtmlBoxes, false);
        course_icons[1].addEventListener("click", showJsBoxes, false);
        course_icons[2].addEventListener("click", showReactBoxes, false);

        appendGroups();
        
        async function appendGroups() {
          try {
            const groupsList = await Promise.all([grabGroup(studyLink), grabGroup(buildLink)]);
            const study = groupsList[0];
            const build = groupsList[1];
            
            //This Shows the people's names and sorts them.
            sortPeople(study);
            //This sorts the times in 2 lists
            createUL(htmlFull12am, studySelectorHTML_Full);
            createUL(htmlFull6am, studySelectorHTML_Full);
            createUL(htmlFull12pm, studySelectorHTML_Full);
            createUL(htmlFull6pm, studySelectorHTML_Full);
            createUL(htmlPart12am, studySelectorHTML_Part);
            createUL(htmlPart6am, studySelectorHTML_Part);
            createUL(htmlPart12pm, studySelectorHTML_Part);
            createUL(htmlPart6pm, studySelectorHTML_Part);
            
            createUL(jsFull12am, studySelectorJS_Full);
            createUL(jsFull6am, studySelectorJS_Full);
            createUL(jsFull12pm, studySelectorJS_Full);
            createUL(jsFull6pm, studySelectorJS_Full);
            createUL(jsPart12am, studySelectorJS_Part);
            createUL(jsPart6am, studySelectorJS_Part);
            createUL(jsPart12pm, studySelectorJS_Part);
            createUL(jsPart6pm, studySelectorJS_Part);

            createUL(reactFull12am, studySelectorReact_Full);
            createUL(reactFull6am, studySelectorReact_Full);
            createUL(reactFull12pm, studySelectorReact_Full);
            createUL(reactFull6pm, studySelectorReact_Full);
            createUL(reactPart12am, studySelectorReact_Part);
            createUL(reactPart6am, studySelectorReact_Part);
            createUL(reactPart12pm, studySelectorReact_Part);
            createUL(reactPart6pm, studySelectorReact_Part);
      
            // function to pass study group arrays to build strings of html that 
            // are unorderedlists of group participants
            function createUL(arr, selector) {
              const label = arr[0];
              const len = arr.length;
              
              let htmlString = '';
              let liString = '';
              
              let ulArr = [];
              
              for (let i = 1; i < len; i++) {
                if (i % 6 === 0) {
                  // if on the 6th name finish concatentation THEN
                  // push string of list items to ul array THEN
                  // reset liString to ''

                  liString += `<li> ${arr[i]} </li>`;
                  ulArr.push(liString);
                  liString = '';

                // }else if (i % 6 !== 0 && (len - i) < 6) {
                //   console.log('here');
                //   liString +=
                //   `
                //   <li>
                //     ${arr[i]}
                //   </li>
                //   `;
                //   for (let j = 0; j <  - len; j++) {
                //     liString += 
                //     `<li>
                //       open
                //     </li>
                //     `;
                //   }
                }else{
                  // add another list item to string
                  liString += `<li> ${arr[i]} </li>`;
                }
              }
              ulArr.push(liString)
              htmlString = makeHTMLString(label, ulArr);
              selector.insertAdjacentHTML('beforeend', htmlString);
            }
          } catch(err) {
            console.log('error', err);
          }
        }

        function makeHTMLString(title, ulArr) {
          let color = '';
          let htmlString = '';
          let rowString = '';
          const len = ulArr.length;

          if (title.includes('HTML')) {color = 'bg-info'}
          else if (title.includes('JavaScript')) {color = 'bg-success'}
          else if (title.includes('React')) {color = 'bg-danger'}

          for (let i = 0; i < len; i++) {
            if ((i + 1) % 4 === 0) {
              rowString += 
              `
              <div class="col-sm-12 col-md-4">
                <div class="card ${color} mb-2">
                  <div class="card-body text-center">
                    <h5 class="card-title">${title}</h5>
                    <ul>
                      ${ulArr[i]}
                    </ul>
                  </div>
                </div>
              </div>
              `;

              htmlString += `<div class="row"> ${rowString} </div>`;
              rowString = '';
            } else{
              rowString += 
              `
              <div class="col-sm-12 col-md-4">
                <div class="card ${color} mb-2">
                  <div class="card-body text-center">
                    <h5 class="card-title">${title}</h5>
                    <ul>
                      ${ulArr[i]}
                    </ul>
                  </div>
                </div>
              </div>
              `;
            }
          }

          htmlString += `<div class="row"> ${rowString}</div>`;
          return htmlString;
        }
    
        async function grabGroup(link) {
          try {
            const res = await fetch(link,
              { headers: {'Content-Type': 'text/plain; charset=utf-8'} });
            const text = await res.text();
            const sheetText = await text.replace('// API callback\ntext(', '')
                                      .replace(');', '');
            const groupObj = await JSON.parse(sheetText);
            const sortedArr = await newParse(groupObj);
            return sortedArr;
          } catch(err) {
            console.log('error', err);
          }
        }

        async function newParse(json) {
          try {
            let newArr = [];
            let returnArr = [];
            for (let key in json.feed.entry) {
              let newObj = {};
              newObj.technology = json.feed.entry[key].gsx$technology.$t;
              newObj.commitment = json.feed.entry[key].gsx$commitment.$t;
              newObj.beginning = json.feed.entry[key].gsx$beginning.$t;
              newObj.name = json.feed.entry[key].gsx$username.$t;
              newArr.push(newObj);
            } 

            returnArr = newArr.sort(sortObjMultProp('technology', 'commitment', 'beginning'));
          
            return returnArr;
          } catch(err) {
            console.log('error', err);
          } 
        }

        function sortObjMultProp() {
          const props = arguments;
          
          return function (obj1, obj2) {
            let i = 0
            let result = 0
            let numberOfProperties = props.length;

            // try getting a different result from 0 (equal) as long as we have // extra properties to compare
            while(result === 0 && i < numberOfProperties) {
              result = dynamicSort(props[i])(obj1, obj2);
              i++;
            }
            return result;
          }
        }

        function dynamicSort(property) {
          let sortOrder = 1;
          if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
          }

          return function (a,b) {
            let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
          }
        }
    
        function sortPeople(people) {
          // this giant conditional sort feels really really hacky
          /* TODO: find a better way to sort/filter the users -- 6/9/2019 This is Chris L, 
              I worked on this TODO. I changed the 'if, else if' statements into one switch statement. */
          people.forEach((person) => {

            switch (true) {
              /****************** FOR HTML AND CSS TECHNOLOGY CHOSEN ***************/
              //Full Time Hours
              case person.technology === 'HTML & CSS' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '12 am':
                htmlFull12am.push(person.name);
                break;
              case person.technology === 'HTML & CSS' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '6 am':
                htmlFull6am.push(person.name);
                break;
              case person.technology === 'HTML & CSS' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '12 pm':
                htmlFull12pm.push(person.name);
                break;
              case person.technology === 'HTML & CSS' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '6 pm':
                htmlFull6pm.push(person.name);
                break;
              //Part Time Hours
              case person.technology === 'HTML & CSS' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '12 am':
                htmlPart12am.push(person.name);
                break;
              case person.technology === 'HTML & CSS' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '6 am':
                htmlPart6am.push(person.name);
                break;
              case person.technology === 'HTML & CSS' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '12 pm':
                htmlPart12pm.push(person.name);
                break;
              case person.technology === 'HTML & CSS' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '6 pm':
                htmlFull6pm.push(person.name);
                break;

              /********************* FOR JAVASCRIPT TECHNOLOGY CHOSEN *****************/
              //Full Time Hours
              case person.technology === 'JavaScript' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '12 am':
                jsFull12am.push(person.name);
                break;
              case person.technology === 'JavaScript' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '6 am':
                jsFull6am.push(person.name);
                break;
              case person.technology === 'JavaScript' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '12 pm': 
                jsFull12pm.push(person.name);
                break;
              case person.technology === 'JavaScript' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '6 pm': 
                jsFull6pm.push(person.name);
                break;
              //Part Time Hours
              case person.technology === 'JavaScript' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '12 am': 
                jsPart12am.push(person.name);
                break;
              case person.technology === 'JavaScript' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '6 am': 
                jsPart6am.push(person.name);
                break;
              case person.technology === 'JavaScript' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '12 pm': 
                jsPart12pm.push(person.name);
                break;
              case person.technology === 'JavaScript' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '6 pm': 
                jsFull6pm.push(person.name);
                break;

            /********************* FOR REACT TECHNOLOGY CHOSEN *****************/
            //Full Time Hours
              case person.technology === 'React' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '12 am':
                reactFull12am.push(person.name);
                break;
              case person.technology === 'React' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '6 am':
                reactFull6am.push(person.name);
                break;
              case person.technology === 'React' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '12 pm': 
                reactFull12pm.push(person.name);
                break;
              case person.technology === 'React' 
                    && person.commitment === 'full time - 6 hours a day' 
                    && person.beginning === '6 pm': 
                reactFull6pm.push(person.name);
                break;
              //Part Time Hours
              case person.technology === 'React' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '12 am': 
                reactPart12am.push(person.name);
                break;
              case person.technology === 'React' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '6 am': 
                reactPart6am.push(person.name);
                break;
              case person.technology === 'React' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '12 pm': 
                reactPart12pm.push(person.name);
                break;
              case person.technology === 'React' 
                    && person.commitment === 'part time - 3 hours a day' 
                    && person.beginning === '6 pm': 
                reactFull6pm.push(person.name);
                break;
            }
          });
        }
        /** 6/12/2019 Chris L: Not sure, didn't quite work the way I wanted it. 
         * - Creating a ajax call for when html & css button is clicked */

        /*const xhrHTMLFull = new XMLHttpRequest();
        xhrHTMLFull.onreadystatechange = () => {
          if(xhrHTMLFull.readyState === 4) {
            document.getElementById("full-time-wrapper").innerHTML = xhrHTMLFull.responseText;
          }
        };
        xhrHTMLFull.open("GET", "./ajax_calls_studyGroup/htmlAjaxFull.html");

        //Ajax Call for the Part time
        const xhrHTMLPart = new XMLHttpRequest();
        xhrHTMLPart.onreadystatechange = () => {
          if(xhrHTMLPart.readyState === 4) {
            document.getElementById("part-time-wrapper").innerHTML = xhrHTMLPart.responseText;
          }
        };
        xhrHTMLPart.open("GET", "./ajax_calls_studyGroup/htmlAjaxPart.html");
        let sendAjaxHTML = () => {
          console.log("button was clicked");
          xhrHTMLFull.send();
          xhrHTMLPart.send();
        }
        /******************* END OF AJAX CALLS  *******************************************/
        
