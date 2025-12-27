// ==UserScript==
// @name         ClickClickDrive - Interactive Quiz
// @namespace    https://github.com/dragnu5
// @version      1.1
// @description  Fast load, ad-block, interactive checkboxes, ui cleanup.
// @author       dragnu5
// @match        https://www.clickclickdrive.de/fragenkatalog/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. INSTANT CSS HIDING (Prevents Flashing) ---
    // We inject a style tag immediately. The browser sees this rule
    // before painting the elements, so they never appear on screen.
    const css = `
    .homepagePhotoWrapper,
    .theoryInfo,
    .tuvDekraWrapper,
    .wrapper {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }
    `;

    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);


    // --- 2. AD & TRACKER BLOCKER ---
    const blockedDomains = [
        'mirando.de',
        'fuseplatform.net',
        'sascdn.com',
        'googlesyndication.com',
        'doubleclick.net',
        'adservice.google',
        'cse.google.com',
        'google.com/adsense'
    ];

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'SCRIPT' && node.src) {
                    if (blockedDomains.some(domain => node.src.includes(domain))) {
                        node.remove();
                    }
                }
            });
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });


    // --- 3. DOM CLEANUP (Garbage Collection) ---
    // Even though they are hidden by CSS, we still want to remove the HTML nodes
    // to stop them from loading images or executing internal scripts.
    function cleanDom() {
        const selectors = [
            '.homepagePhotoWrapper',
            '.theoryInfo',
            '.tuvDekraWrapper',
            '.wrapper'
        ];
        selectors.forEach(sel => {
            const els = document.querySelectorAll(sel);
            els.forEach(el => el.remove());
        });
    }
    // Check repeatedly for the first few seconds to remove nodes as they parse
    const cleanInterval = setInterval(cleanDom, 100);
    setTimeout(() => clearInterval(cleanInterval), 3000);


    // --- 4. QUIZ INITIALIZATION LOOP ---
    // Only runs on question pages
    const checkQuizInterval = setInterval(() => {
        const scrollLinkDiv = document.querySelector('.scrollLink');
        const optionsLists = document.querySelectorAll('.options');

        if (scrollLinkDiv && optionsLists.length >= 2) {
            clearInterval(checkQuizInterval);
            initQuiz(scrollLinkDiv, optionsLists);
        }
    }, 50);

    setTimeout(() => clearInterval(checkQuizInterval), 10000);


    // --- 5. QUIZ LOGIC ---
    function initQuiz(scrollLinkDiv, allOptionsLists) {

        // Remove specific quiz garbage
        const h3Correct = document.querySelector('h3#correct');
        if (h3Correct) h3Correct.remove();

        const questionDiv = allOptionsLists[0];
        const answerDiv = allOptionsLists[1];

        // Hide answer key
        answerDiv.style.display = 'none';

        // Hide comment wrapper
        const commentWrapper = document.querySelector('.commentWrapper');
        if (commentWrapper) {
            commentWrapper.style.display = 'none';
            const backToTop = commentWrapper.querySelector('.scrollLink');
            if (backToTop) backToTop.remove();
        }

        // Inject Checkboxes
        const questionItems = questionDiv.querySelectorAll('li');
        questionItems.forEach(li => {
            if (li.querySelector('.user-checkbox')) return;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'user-checkbox';
            checkbox.style.marginRight = '10px';
            checkbox.style.transform = 'scale(1.3)';
            checkbox.style.cursor = 'pointer';

            li.insertBefore(checkbox, li.firstChild);

            li.style.listStyle = 'none';
            li.style.cursor = 'pointer';
            li.style.padding = '5px';
            li.style.borderRadius = '5px';

            li.addEventListener('click', (e) => {
                if (e.target !== checkbox && !checkbox.disabled) {
                    checkbox.checked = !checkbox.checked;
                }
            });
        });

        // Toolbar UI
        const actionButton = scrollLinkDiv.querySelector('a');
        if (actionButton) {
            actionButton.textContent = "Show answer";
            actionButton.removeAttribute('href');
        }

        const nextLi = document.querySelector('.questionLinks .next');
        let nextLink = null;

        const toolbar = document.createElement('div');
        toolbar.style.display = 'flex';
        toolbar.style.justifyContent = 'space-between';
        toolbar.style.alignItems = 'center';
        toolbar.style.marginTop = '20px';
        toolbar.style.padding = '10px 0';
        toolbar.style.borderTop = '1px solid #eee';

        if (actionButton) {
            toolbar.appendChild(actionButton);
            actionButton.style.display = 'inline-block';
            actionButton.style.padding = '10px 20px';
            actionButton.style.backgroundColor = '#007bff';
            actionButton.style.color = '#fff';
            actionButton.style.borderRadius = '4px';
            actionButton.style.textDecoration = 'none';
            actionButton.style.fontWeight = 'bold';
            actionButton.style.cursor = 'pointer';
        }

        if (nextLi) {
            nextLink = nextLi.querySelector('a');
            if (nextLink) {
                nextLink.style.display = 'flex';
                nextLink.style.alignItems = 'center';
                nextLink.style.padding = '10px 20px';
                nextLink.style.backgroundColor = '#f8f9fa';
                nextLink.style.border = '1px solid #ddd';
                nextLink.style.color = '#333';
                nextLink.style.borderRadius = '4px';
                nextLink.style.textDecoration = 'none';
                toolbar.appendChild(nextLink);
            }
            const oldLinks = document.querySelector('.questionLinks');
            if (oldLinks) oldLinks.style.display = 'none';
        }

        scrollLinkDiv.parentNode.insertBefore(toolbar, scrollLinkDiv);
        scrollLinkDiv.remove();

        // Check Logic
        if (actionButton) {
            let isEvaluated = false;
            actionButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                if (isEvaluated) return;
                isEvaluated = true;

                const correctLetters = Array.from(answerDiv.querySelectorAll('li .optionName'))
                .map(el => el.textContent.trim());

                questionItems.forEach(li => {
                    const checkbox = li.querySelector('.user-checkbox');
                    const nameEl = li.querySelector('.optionName');
                    if (!nameEl) return;

                    const optionLetter = nameEl.textContent.trim();
                    const isCorrect = correctLetters.includes(optionLetter);
                    const isChecked = checkbox.checked;

                    checkbox.disabled = true;

                    if (isCorrect) {
                        li.style.color = "#155724";
                        li.style.fontWeight = "bold";
                        if (isChecked) {
                            li.style.backgroundColor = "#d4edda";
                            li.style.border = "1px solid #c3e6cb";
                        } else {
                            li.style.backgroundColor = "#fff3cd";
                            li.style.border = "1px solid #ffeeba";
                            const msg = document.createElement('span');
                            msg.textContent = " (Missing)";
                            msg.style.fontSize = "0.8em";
                            li.appendChild(msg);
                        }
                    } else {
                        if (isChecked) {
                            li.style.color = "#721c24";
                            li.style.backgroundColor = "#f8d7da";
                            li.style.border = "1px solid #f5c6cb";
                            li.style.textDecoration = "line-through";
                        } else {
                            li.style.opacity = "0.5";
                        }
                    }
                });

                if (commentWrapper) commentWrapper.style.display = 'block';

                actionButton.textContent = "Result Checked";
                actionButton.style.backgroundColor = "#6c757d";
                actionButton.style.cursor = "default";
            });
        }
    }

})();
