// ==UserScript==
// @name         ClickClickDrive - Interactive Quiz
// @namespace    https://github.com/dragnu5
// @version      1.0
// @description  Fast load, ad-block, interactive checkboxes, ui cleanup.
// @author       dragnu5
// @match        https://www.clickclickdrive.de/fragenkatalog/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- 0. AD & TRACKER BLOCKER ---
    // Blocks specific domains to clean up console and speed up load
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


    // --- 1. INITIALIZATION LOOP ---
    // Checks every 50ms to run immediately when elements are ready
    const checkInterval = setInterval(() => {
        const scrollLinkDiv = document.querySelector('.scrollLink'); // This finds the top one
        const optionsLists = document.querySelectorAll('.options');

        if (scrollLinkDiv && optionsLists.length >= 2) {
            clearInterval(checkInterval);
            initQuiz(scrollLinkDiv, optionsLists);
        }
    }, 50);


    // --- 2. MAIN LOGIC ---
    function initQuiz(scrollLinkDiv, allOptionsLists) {

        // A. CLEANUP
        const wrapper = document.querySelector('.wrapper');
        if (wrapper) wrapper.remove();

        const h3Correct = document.querySelector('h3#correct');
        if (h3Correct) h3Correct.remove();

        const questionDiv = allOptionsLists[0];
        const answerDiv = allOptionsLists[1];

        // Hide answer key immediately
        answerDiv.style.display = 'none';

        // Handle Comment Wrapper
        const commentWrapper = document.querySelector('.commentWrapper');
        if (commentWrapper) {
            commentWrapper.style.display = 'none';

            // ** NEW: Remove "Zurück nach oben" link inside comments **
            const backToTop = commentWrapper.querySelector('.scrollLink');
            if (backToTop) backToTop.remove();
        }

        // B. INJECT CHECKBOXES
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

        // C. TOOLBAR UI
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

        // Swap out the old scroll link for our new toolbar
        scrollLinkDiv.parentNode.insertBefore(toolbar, scrollLinkDiv);
        scrollLinkDiv.remove();

        // D. CHECK ANSWER LOGIC
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
