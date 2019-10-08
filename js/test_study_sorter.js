// TODO: need to break this into modules rather than one long file
    
        // TODO: do we need to hide the links to the page?
        // private key stuff - check into this
        // write up a blog post about this procedure - reference other websites:
        // https://coderwall.com/p/duapqq/use-a-google-spreadsheet-as-your-json-backend
        // https://stackoverflow.com/questions/24531351/retrieve-google-spreadsheet-worksheet-json
        const studyLink = 'https://spreadsheets.google.com/feeds/list/1PMWsPEfHFC6myMwhdidyr2hhRK5ZA-JrDQzwRoDTFaw/oua1i2d/public/values?alt=json-in-script&callback=text';
        const buildLink = 'https://spreadsheets.google.com/feeds/list/1PMWsPEfHFC6myMwhdidyr2hhRK5ZA-JrDQzwRoDTFaw/oua1i2d/public/values?alt=json-in-script&callback=text';

        //Getting the full time side nav buttons --Jonathan was here--
        const ft_html_css_button = document.getElementById("ft_HTML&CSS_Tab")
        const ft_responsive_design_button = document.getElementById("ft_ResponsiveDesignAndCSSAnimations_Tab");
        const ft_javascript_button = document.getElementById("ft_Javascript_Tab");
        const ft_sql_button = document.getElementById("ft_SQL_Tab");
        const ft_node_button = document.getElementById("ft_NodeExpress_Tab");
        const ft_react_button = document.getElementById("ft_React_Tab");
        const ft_reactnative_button = document.getElementById("ft_ReactNative_Tab");
        const ft_maths_button = document.getElementById("ft_Maths_Tab");
        const ft_python_button = document.getElementById("ft_Python_Tab");
        const ft_django_button = document.getElementById("ft_Django_Tab");
        const ft_electron_button = document.getElementById("ft_Electron_Tab");
        const ft_php_button = document.getElementById("ft_PHP_Tab");
        const ft_webdesign_button = document.getElementById("ft_WebDesign_Tab");
        const ft_digital_marketing_button = document.getElementById("ft_DigitalMarketing_Tab");
        const ft_data_science_button = document.getElementById("ft_DataScience_Tab");
        const ft_web_security_button = document.getElementById("ft_WebSecurity_Tab");
        const ft_ecommerce_button = document.getElementById("ft_E-Commerce_Tab");
        const ft_cplusplus_button = document.getElementById("ft_C++_Tab");
        const ft_mobile_development_button = document.getElementById("ft_MobileDevelopment_Tab");
        const ft_java_button = document.getElementById("ft_Java_Tab");
        const ft_virtual_reality_button = document.getElementById("ft_VirtualReality_Tab");
        const ft_linux_button = document.getElementById("ft_Linux_Tab");
        const ft_git_button = document.getElementById("ft_GitGitHub_Tab");
        const ft_wordpress_button = document.getElementById("ft_Wordpress_Tab");
        const ft_blockchain_button = document.getElementById("ft_BlockChain_Tab");
        const ft_ai_button = document.getElementById("ft_AI_Tab");
        const ft_video_production_button = document.getElementById("ft_VideoProduction_Tab");
        const ft_laravel_button = document.getElementById("ft_Laravel_Tab");
        const ft_computer_science_button = document.getElementById("ft_ComputerScience_Tab");
        const ft_realestate_investing_button = document.getElementById("ft_RealEstateInvesting_Tab");
        const ft_smalltalk_button = document.getElementById("ft_HTMLft_SmallTalk_Tab_CSS_Tab");
        const ft_mongodb_button = document.getElementById("ft_MongoDB_Tab");
        const ft_startup_school_button = document.getElementById("ft_StartupSchool_Tab");
        const ft_ruby_button = document.getElementById("ft_Ruby_Tab");
        const ft_swift_button = document.getElementById("ft_Swift_Tab");
        const ft_c_button = document.getElementById("ft_C_Tab");
        const ft_firebase_button = document.getElementById("ft_Firebase_Tab");
        const ft_aws_button = document.getElementById("ft_AWS_Tab");
        const ft_csharp_button = document.getElementById("ft_csharp_Tab");


        //Getting the part time side nav buttons --Jonathan was here--
        const pt_html_css_button = document.getElementById("pt_HTML&CSS_Tab")
        const pt_responsive_design_button = document.getElementById("pt_ResponsiveDesignAndCSSAnimations_Tab");
        const pt_javascript_button = document.getElementById("pt_Javascript_Tab");
        const pt_sql_button = document.getElementById("pt_SQL_Tab");
        const pt_node_button = document.getElementById("pt_NodeExpress_Tab");
        const pt_react_button = document.getElementById("pt_React_Tab");
        const pt_reactnative_button = document.getElementById("pt_ReactNative_Tab");
        const pt_maths_button = document.getElementById("pt_Maths_Tab");
        const pt_python_button = document.getElementById("pt_Python_Tab");
        const pt_django_button = document.getElementById("pt_Django_Tab");
        const pt_electron_button = document.getElementById("pt_Electron_Tab");
        const pt_php_button = document.getElementById("pt_PHP_Tab");
        const pt_webdesign_button = document.getElementById("pt_WebDesign_Tab");
        const pt_digital_marketing_button = document.getElementById("pt_DigitalMarketing_Tab");
        const pt_data_science_button = document.getElementById("pt_DataScience_Tab");
        const pt_web_security_button = document.getElementById("pt_WebSecurity_Tab");
        const pt_ecommerce_button = document.getElementById("pt_E-Commerce_Tab");
        const pt_cplusplus_button = document.getElementById("pt_C++_Tab");
        const pt_mobile_development_button = document.getElementById("pt_MobileDevelopment_Tab");
        const pt_java_button = document.getElementById("pt_Java_Tab");
        const pt_virtual_reality_button = document.getElementById("pt_VirtualReality_Tab");
        const pt_linux_button = document.getElementById("pt_Linux_Tab");
        const pt_git_button = document.getElementById("pt_GitGitHub_Tab");
        const pt_wordpress_button = document.getElementById("pt_Wordpress_Tab");
        const pt_blockchain_button = document.getElementById("pt_BlockChain_Tab");
        const pt_ai_button = document.getElementById("pt_AI_Tab");
        const pt_video_production_button = document.getElementById("pt_VideoProduction_Tab");
        const pt_laravel_button = document.getElementById("pt_Laravel_Tab");
        const pt_computer_science_button = document.getElementById("pt_ComputerScience_Tab");
        const pt_realestate_investing_button = document.getElementById("pt_RealEstateInvesting_Tab");
        const pt_smalltalk_button = document.getElementById("pt_SmallTalk_Tab");
        const pt_mongodb_button = document.getElementById("pt_MongoDB_Tab");
        const pt_startup_school_button = document.getElementById("pt_StartupSchool_Tab");
        const pt_ruby_button = document.getElementById("pt_Ruby_Tab");
        const ft_swift_button = document.getElementById("ft_Swift_Tab");
        const ft_c_button = document.getElementById("ft_C_Tab");
        const ft_firebase_button = document.getElementById("ft_Firebase_Tab");
        const ft_aws_button = document.getElementById("ft_AWS_Tab");
        const pt_csharp_button = document.getElementById("pt_csharp_Tab");

        
        // Getting the side nav mobile icon buttons


        // Creating new full time Div elements.
        const html_full_new_el = document.createElement("DIV");
        const responsiveDesign_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const node_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const reactNative_full_new_el = document.createElement("DIV");
        const maths_full_new_el = document.createElement("DIV");
        const html_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const html_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const html_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const html_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const html_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const html_full_new_el = document.createElement("DIV");
        const html_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const react_full_new_el = document.createElement("DIV");
        const html_full_new_el = document.createElement("DIV");
        const js_full_new_el = document.createElement("DIV");

        // Creating new part time Div elements.
        const html_part_new_el = document.createElement("DIV");
        const html_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const html_part_new_el = document.createElement("DIV");
        const html_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const html_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const html_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const html_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const html_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const html_part_new_el = document.createElement("DIV");
        const html_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const react_part_new_el = document.createElement("DIV");
        const html_part_new_el = document.createElement("DIV");
        const js_part_new_el = document.createElement("DIV");





        