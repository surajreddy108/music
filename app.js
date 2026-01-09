class PrabhupadaVaniPlayer {
    constructor() {
        this.lectures = window.lecturesData || [];
        this.currentLecture = null;
        this.currentTab = 'all';
        this.favorites = new Set();
        this.currentAudio = null;
        this.isPlaying = false;
        this.repeatMode = false;
        this.filteredLectures = [...this.lectures];
        
        this.init();
    }

    init() {
        this.loadFavorites();
        this.setupEventListeners();
        this.populateFilters();
        this.renderAllLectures();
        this.updateFavoritesList();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterLectures(e.target.value);
        });

        // Year filter
        document.getElementById('year-filter').addEventListener('change', (e) => {
            this.filterLectures();
        });

        // Location filter
        document.getElementById('location-filter').addEventListener('change', (e) => {
            this.filterLectures();
        });

        // Shuffle button
        document.getElementById('shuffle-btn').addEventListener('click', () => {
            this.shufflePlaylist();
        });

        // Player controls
        const audioPlayer = document.getElementById('audio-player');
        
        document.getElementById('play-pause-btn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        document.getElementById('prev-btn').addEventListener('click', () => {
            this.playPrevious();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            this.playNext();
        });

        document.getElementById('repeat-btn').addEventListener('click', () => {
            this.toggleRepeat();
        });

        document.getElementById('volume-slider').addEventListener('input', (e) => {
            audioPlayer.volume = e.target.value;
        });

        // Audio events
        audioPlayer.addEventListener('ended', () => {
            if (this.repeatMode) {
                audioPlayer.currentTime = 0;
                audioPlayer.play();
            } else {
                this.playNext();
            }
        });

        audioPlayer.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
        });

        audioPlayer.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });
    }

    populateFilters() {
        const yearFilter = document.getElementById('year-filter');
        const locationFilter = document.getElementById('location-filter');
        
        // Get unique years
        const years = [...new Set(this.lectures.map(l => {
            const date = new Date(l.date);
            return date.getFullYear();
        }))].sort((a, b) => b - a);
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });

        // Get unique locations
        const locations = [...new Set(this.lectures.map(l => l.location).filter(Boolean))].sort();
        
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab UI
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-content`);
        });

        // Render appropriate content
        switch(tabName) {
            case 'all':
                this.renderLectures(this.filteredLectures, 'all-list');
                break;
            case 'bhagavad-gita':
                const bgLectures = this.filteredLectures.filter(l => 
                    l.title.toLowerCase().includes('bhagavad-gita')
                );
                this.renderLectures(bgLectures, 'bhagavad-gita-list');
                break;
            case 'srimad-bhagavatam':
                const sbLectures = this.filteredLectures.filter(l => 
                    l.title.toLowerCase().includes('srimad-bhagavatam') || 
                    l.title.toLowerCase().includes('bhagavatam')
                );
                this.renderLectures(sbLectures, 'srimad-bhagavatam-list');
                break;
            case 'caitanya-caritamrta':
                const ccLectures = this.filteredLectures.filter(l => 
                    l.title.toLowerCase().includes('caitanya-caritamrta') ||
                    l.title.toLowerCase().includes('caitanya')
                );
                this.renderLectures(ccLectures, 'caitanya-caritamrta-list');
                break;
            case 'other':
                const otherLectures = this.filteredLectures.filter(l => 
                    !l.title.toLowerCase().includes('bhagavad-gita') &&
                    !l.title.toLowerCase().includes('bhagavatam') &&
                    !l.title.toLowerCase().includes('caitanya-caritamrta') &&
                    !l.title.toLowerCase().includes('caitanya')
                );
                this.renderLectures(otherLectures, 'other-list');
                break;
            case 'favorites':
                this.updateFavoritesList();
                break;
        }
    }

    filterLectures(searchTerm = '') {
        const yearFilter = document.getElementById('year-filter').value;
        const locationFilter = document.getElementById('location-filter').value;
        
        this.filteredLectures = this.lectures.filter(lecture => {
            // Search term filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = lecture.title.toLowerCase().includes(searchLower) ||
                                     lecture.location.toLowerCase().includes(searchLower) ||
                                     lecture.date.includes(searchTerm);
                if (!matchesSearch) return false;
            }
            
            // Year filter
            if (yearFilter) {
                const lectureYear = new Date(lecture.date).getFullYear();
                if (lectureYear.toString() !== yearFilter) return false;
            }
            
            // Location filter
            if (locationFilter && lecture.location !== locationFilter) {
                return false;
            }
            
            return true;
        });
        
        this.switchTab(this.currentTab);
    }

    shufflePlaylist() {
        const shuffled = [...this.filteredLectures];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        if (shuffled.length > 0) {
            this.playLecture(shuffled[0]);
        }
        
        this.renderLectures(shuffled, `${this.currentTab}-list`);
    }

    renderLectures(lectures, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (lectures.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No lectures found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = lectures.map(lecture => this.createLectureElement(lecture)).join('');
        
        // Add click handlers to play buttons
        container.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.playLecture(lectures[index]);
            });
        });
        
        // Add click handlers to favorite buttons
        container.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.toggleFavorite(lectures[index]);
            });
        });
        
        // Add click handlers to entire lecture item
        container.querySelectorAll('.lecture-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('play-btn') && 
                    !e.target.classList.contains('favorite-btn') &&
                    !e.target.closest('.play-btn') &&
                    !e.target.closest('.favorite-btn')) {
                    const index = parseInt(item.dataset.index);
                    this.playLecture(lectures[index]);
                }
            });
        });
    }

    createLectureElement(lecture) {
        const index = this.filteredLectures.indexOf(lecture);
        const isPlaying = this.currentLecture === lecture;
        const isFavorited = this.favorites.has(lecture.link);
        const date = new Date(lecture.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="lecture-item ${isPlaying ? 'playing' : ''}" data-index="${index}">
                <div class="lecture-title">${lecture.title}</div>
                <div class="lecture-meta">
                    <span><i class="far fa-calendar"></i> ${formattedDate}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${lecture.location || 'Unknown'}</span>
                </div>
                <div class="lecture-actions">
                    <button class="play-btn" data-index="${index}">
                        <i class="fas fa-${isPlaying ? 'pause' : 'play'}"></i>
                        ${isPlaying ? 'Playing' : 'Play'}
                    </button>
                    <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-index="${index}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderAllLectures() {
        this.renderLectures(this.filteredLectures, 'all-list');
    }

    playLecture(lecture) {
        this.currentLecture = lecture;
        const audioPlayer = document.getElementById('audio-player');
        
        // Update audio source
        audioPlayer.src = lecture.link;
        
        // Update UI
        document.getElementById('current-title').textContent = lecture.title;
        document.getElementById('current-details').innerHTML = `
            <div><i class="far fa-calendar"></i> ${new Date(lecture.date).toLocaleDateString()}</div>
            <div><i class="fas fa-map-marker-alt"></i> ${lecture.location || 'Unknown location'}</div>
        `;
        
        // Play audio
        audioPlayer.play().catch(e => {
            console.error('Error playing audio:', e);
            alert('Unable to play audio. The file might not be accessible.');
        });
        
        // Update lecture items
        this.updatePlayingState();
        
        // Scroll to player
        document.querySelector('.player-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    togglePlayPause() {
        const audioPlayer = document.getElementById('audio-player');
        
        if (this.isPlaying) {
            audioPlayer.pause();
        } else {
            if (audioPlayer.src) {
                audioPlayer.play();
            } else if (this.filteredLectures.length > 0) {
                this.playLecture(this.filteredLectures[0]);
            }
        }
    }

    playNext() {
        if (!this.currentLecture || this.filteredLectures.length === 0) return;
        
        const currentIndex = this.filteredLectures.indexOf(this.currentLecture);
        const nextIndex = (currentIndex + 1) % this.filteredLectures.length;
        
        this.playLecture(this.filteredLectures[nextIndex]);
    }

    playPrevious() {
        if (!this.currentLecture || this.filteredLectures.length === 0) return;
        
        const currentIndex = this.filteredLectures.indexOf(this.currentLecture);
        const prevIndex = (currentIndex - 1 + this.filteredLectures.length) % this.filteredLectures.length;
        
        this.playLecture(this.filteredLectures[prevIndex]);
    }

    toggleRepeat() {
        this.repeatMode = !this.repeatMode;
        const repeatBtn = document.getElementById('repeat-btn');
        repeatBtn.classList.toggle('active', this.repeatMode);
    }

    toggleFavorite(lecture) {
        if (this.favorites.has(lecture.link)) {
            this.favorites.delete(lecture.link);
        } else {
            this.favorites.add(lecture.link);
        }
        
        this.saveFavorites();
        this.updateFavoritesList();
        this.updatePlayingState();
    }

    updateFavoritesList() {
        const favoriteLectures = this.filteredLectures.filter(l => this.favorites.has(l.link));
        const container = document.getElementById('favorites-list');
        
        if (favoriteLectures.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h3>No favorites yet</h3>
                    <p>Click the heart icon on any lecture to add it to favorites</p>
                </div>
            `;
        } else {
            this.renderLectures(favoriteLectures, 'favorites-list');
        }
    }

    updatePlayingState() {
        // Update all lecture items
        document.querySelectorAll('.lecture-item').forEach(item => {
            const index = parseInt(item.dataset.index);
            const lecture = this.filteredLectures[index];
            
            if (lecture) {
                item.classList.toggle('playing', lecture === this.currentLecture);
                
                const playBtn = item.querySelector('.play-btn');
                if (playBtn) {
                    playBtn.innerHTML = `
                        <i class="fas fa-${lecture === this.currentLecture && this.isPlaying ? 'pause' : 'play'}"></i>
                        ${lecture === this.currentLecture && this.isPlaying ? 'Playing' : 'Play'}
                    `;
                }
                
                const favoriteBtn = item.querySelector('.favorite-btn');
                if (favoriteBtn) {
                    favoriteBtn.classList.toggle('favorited', this.favorites.has(lecture.link));
                }
            }
        });
    }

    updatePlayButton() {
        const playBtn = document.getElementById('play-pause-btn');
        playBtn.innerHTML = `
            <i class="fas fa-${this.isPlaying ? 'pause' : 'play'}"></i>
        `;
    }

    saveFavorites() {
        localStorage.setItem('prabhupadaFavorites', JSON.stringify([...this.favorites]));
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('prabhupadaFavorites');
            if (saved) {
                this.favorites = new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Error loading favorites:', e);
        }
    }
}

// Initialize the player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.player = new PrabhupadaVaniPlayer();
});
