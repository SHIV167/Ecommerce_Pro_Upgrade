import React from 'react';

const AboutUsPage = () => {
  return (
    <div 
      className="bg-cover bg-center bg-fixed text-gray-800 font-body"
      style={{ backgroundImage: "url('/uploads/fullbg_Desktop.webp')" }}
    >
      <div className="bg-white bg-opacity-75">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl lg:text-7xl font-bold font-heading text-gray-900 mb-4">Story of KAMA AYURVEDA</h1>
        <p className="text-xl text-gray-700">Discover the ancient wisdom of nature, reimagined for modern life.</p>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Section 1: ENERGY OF LIFE – WISDOM OF NATURE */}
        <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-2xl flex flex-col md:flex-row items-center my-12">
          <div className="md:w-1/2">
            <img src="/uploads/banners/about-us-energy-of-life.webp" alt="Energy of Life – Wisdom of Nature" className="w-full h-auto object-cover rounded-lg shadow-lg" />
          </div>
          <div className="md:w-1/2 md:pl-12 mt-8 md:mt-0">
            <h2 className="text-3xl font-heading mb-4 text-center md:text-left">ENERGY OF LIFE – WISDOM OF NATURE</h2>
            <p className="text-lg leading-relaxed text-center md:text-left">
              “In Sanskrit,<br />
              &#123;kama&#125; means ‘desire’, the energy of life<br />
              &#123;ayurveda&#125; means ‘science of life’, the wisdom of nature.<br />
              Kama Ayurveda combines them together.”
            </p>
          </div>
        </div>

        {/* Section 2: A NEW BRAND, WITH AN OLD STORY */}
        <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-2xl flex flex-col md:flex-row-reverse items-center my-12">
          <div className="md:w-1/2">
            <img src="/uploads/banners/about-us-old-story.webp" alt="A New Brand, With an Old Story" className="w-full h-auto object-cover rounded-lg shadow-lg" />
          </div>
          <div className="md:w-1/2 md:pr-12 mt-8 md:mt-0">
            <h3 className="text-3xl font-heading mb-4 text-center md:text-left">A NEW BRAND, WITH AN OLD STORY</h3>
            <p className="text-lg leading-relaxed text-justify">
              The story of <strong>KAMA AYURVEDA</strong> began when its founder <strong>Vivek Sahni</strong> rediscovered medicinal preparations from Vedic books with the guidance of an Ayurvedic guru in Kerala, the cradle of Ayurveda back in 2002. From this discovery onwards, he became an avid proponent of the ancestral wisdom and set out on a pioneering mission: to share and bring these ancient wellness and medicinal practices and formulations back into modern life.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              That is why Vivek Sahni founded Kama Ayurveda with the goal of creating skincare and haircare products made from these ancestral formulations, all based on the holistic philosophy at the heart of Ayurveda.
            </p>
          </div>
        </div>

        {/* Section 3: KAMA AYURVEDA PROMOTES ‘Beauty in Balance’ */}
        <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-2xl flex flex-col md:flex-row items-center my-12">
          <div className="md:w-1/2">
            <img src="/uploads/banners/about-us-kama-promotes.webp" alt="Kama Ayurveda Promotes ‘Beauty in Balance’" className="w-full h-auto object-cover rounded-lg shadow-lg" />
          </div>
          <div className="md:w-1/2 md:pl-12 mt-8 md:mt-0">
            <h3 className="text-3xl font-heading mb-4 text-center md:text-left">KAMA AYURVEDA PROMOTES <br/> <strong>‘Beauty</strong> <em>in</em> <strong>Balance’</strong></h3>
            <p className="text-lg leading-relaxed text-justify">
              Our guiding philosophy - that the key to preserving health and well-being was, and is, to reestablish the essential, necessary balance between mind, body and soul.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              Our belief - that daily practices can reestablish balance using herbs, foods, exercise and meditation, and so bring us back to the purest form of beauty; one that is healthy, radiant, aligned.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              Rooted in Kerala, the creation of Kama Ayurveda coincides with the rediscovery of ancient texts, from sacred Vedic books that held the transcription of centuries-old medicinal Ayurvedic preparations.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              This unique yet universal approach to healing medicine was based in a deeply analytical understanding of nature: Ayurveda – sanskrit for ‘Wisdom of Nature’ or ‘Science of Life’.’
            </p>
            <p className="text-lg leading-relaxed mt-4">
              Our mission - to bring into light the powerful, eternal wisdoms contained therein.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
