<template>
  <div class="movieCard">
    <template v-if="item.poster_path">
      <img 
        v-if="item.media_type === 'movie'" 
        :src="imageUrl + item.poster_path" 
        :alt="item.title"
        class="card-img-cover" 
      />
      <img 
        v-else-if="item.media_type === 'tv'" 
        :src="imageUrl + item.poster_path" 
        :alt="item.name"
        class="card-img-cover" 
      />
    </template>
    
    <div class="card-img-overlay">
      <div class="info">
        <time v-if="item.media_type === 'movie'">{{ parseDate(item.release_date) }}</time>
        <time v-else-if="item.media_type === 'tv'">{{ parseDate(item.first_air_date) }}</time>
        
        <small v-if="item.vote_average">
          <font-awesome-icon 
            v-for="i in 5" 
            :key="i"
            :icon="getStarIcon(i, item.vote_average)"
          />
        </small>
        
        <label v-if="item.media_type === 'movie'">{{ item.title }}</label>
        <label v-else-if="item.media_type === 'tv'">{{ item.name }}</label>
        
        <p v-if="item.overview">{{ parseDescription(item.overview, 384) }}</p>
      </div>

      <div class="providers" v-if="item.providers && item.providers.flatrate">
        <template v-if="item.media_type === 'movie'">
          <a 
            v-for="service in item.providers.flatrate" 
            :key="service.provider_id" 
            :href="parseUrl(service.url, item.title)"
            class="provider-icon"
          >
            <img :src="service.logo_path" :alt="service.provider_name" />
          </a>
        </template>
        <template v-else-if="item.media_type === 'tv'">
          <a 
            v-for="service in item.providers.flatrate" 
            :key="service.provider_id" 
            :href="parseUrl(service.url, item.name)"
            class="provider-icon"
          >
            <img :src="service.logo_path" :alt="service.provider_name" />
          </a>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MovieCard',
  props: {
    item: {
      type: Object,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    }
  },
  methods: {
    parseDate(date) {
      return new Date(date).getFullYear();
    },
    parseStars(stars) {
      return Math.round(stars) / 2;
    },
    getStarIcon(position, voteAverage) {
      const stars = this.parseStars(voteAverage);
      if ((position - 0.5) < stars) {
        return ['fas', 'star'];
      } else if ((position - 0.5) === stars) {
        return ['far', 'star-half-stroke'];
      } else {
        return ['far', 'star'];
      }
    },
    parseDescription(desc, size) {
      size--;
      if (desc.length <= size) {
        return desc;
      }

      desc = desc.slice(0, desc.lastIndexOf("."));

      while (desc.length > size) {
        if (desc.lastIndexOf(".") > 0) {
          desc = desc.slice(0, desc.lastIndexOf("."));
        } else {
          desc = "Ash nazg durbatulûk, ash nazg gimbatul, ash nazg thrakatulûk agh burzum-ishi krimpatul.";
          break;
        }
      }
      return desc + ".";
    },
    parseUrl(url, name) {
      return url.replace("%query%", encodeURIComponent(name));
    }
  }
}
</script>

<style scoped>
/* Gli stili sono già nel CSS globale */
</style>
