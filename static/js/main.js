document.addEventListener('DOMContentLoaded', () => {
    const drops = [
        { zone: document.getElementById('drop-1'), input: document.getElementById('file-1'), nameEl: document.querySelector('#drop-1 .file-name') },
        { zone: document.getElementById('drop-2'), input: document.getElementById('file-2'), nameEl: document.querySelector('#drop-2 .file-name') }
    ];
    const compareBtn = document.getElementById('compare-btn');
    const loader = document.getElementById('loader');
    const results = document.getElementById('results');
    const diffOutput = document.getElementById('diff-output');

    let files = [null, null];

    drops.forEach((d, index) => {
        d.zone.addEventListener('click', () => d.input.click());

        d.input.addEventListener('change', (e) => {
            handleFile(e.target.files[0], index);
        });

        d.zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            d.zone.classList.add('active');
        });

        d.zone.addEventListener('dragleave', () => {
            d.zone.classList.remove('active');
        });

        d.zone.addEventListener('drop', (e) => {
            e.preventDefault();
            d.zone.classList.remove('active');
            handleFile(e.dataTransfer.files[0], index);
        });
    });

    function handleFile(file, index) {
        if (file && file.type === 'application/pdf') {
            files[index] = file;
            drops[index].zone.classList.add('file-ready');
            drops[index].nameEl.textContent = file.name;
            checkReady();
        } else {
            alert('Please select a valid PDF file.');
        }
    }

    function checkReady() {
        compareBtn.disabled = !(files[0] && files[1]);
    }

    compareBtn.addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('file1', files[0]);
        formData.append('file2', files[1]);

        // Reset UI
        compareBtn.disabled = true;
        loader.style.display = 'block';
        results.classList.remove('visible');
        diffOutput.innerHTML = '';

        try {
            const response = await fetch('/compare', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                diffOutput.innerHTML = data.diff;
                results.classList.add('visible');
                // Scroll to results
                results.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert(data.error || 'An error occurred during comparison.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to connect to the server.');
        } finally {
            loader.style.display = 'none';
            compareBtn.disabled = false;
        }
    });
});
