/* Clarify practice paper. The study, data, and authors are invented for teaching; the structure follows a real
   IMRaD research article. Paragraph ids are stable so marks survive edits to other paragraphs. */
window.SPECIMEN = {
  id: "specimen-cardinals",
  title: "City Lights and Early Singers: Artificial Light at Night Advances Dawn Song in Northern Cardinals Along an Urban–Rural Gradient",
  authors: "Clarify Practice Papers, No. 1",
  source: "A practice paper written for Clarify. The study and its data are invented; the structure is real.",
  license: "CC BY 4.0",
  sections: [
    { id: "abs", heading: "Abstract", paras: [
      { id: "a1", text: "Artificial light at night (ALAN) is spreading faster than urban land cover itself, yet its effects on the daily timing of animal behavior remain unevenly documented. We recorded dawn song at 18 sites across an urban–rural gradient in the southeastern United States during the spring breeding season and measured night-time light at each site with a handheld photometer. Northern Cardinals (Cardinalis cardinalis) at the brightest sites began singing a mean of 21 minutes earlier relative to civil twilight than cardinals at the darkest sites (95% CI: 14–28 min). The effect remained after accounting for traffic noise, temperature, and date. These results suggest that night lighting, rather than urban noise alone, may shift the start of the avian day, with possible consequences for energy budgets and mate attraction that remain to be tested." }
    ]},
    { id: "intro", heading: "Introduction", paras: [
      { id: "i1", text: "Many songbirds begin singing before sunrise in a burst of activity known as the dawn chorus. The timing of the first song is closely tied to light: as the sky brightens, light-sensitive cells in the eye and brain signal the bird's internal circadian clock, and singing follows. Because dawn song helps birds defend territories and attract mates, a shift in when it starts could change how birds spend energy and how they compete with neighbors [1]." },
      { id: "i2", text: "Cities change the conditions that set this clock. Street lamps, parking lots, and lit buildings raise light levels at night, a pattern called artificial light at night (ALAN). Cities are also loud, and earlier studies proposed that some birds sing earlier to avoid being drowned out by morning traffic [2, 3]. Because light and noise usually rise together toward a city center, it has been difficult to tell which one is responsible for earlier singing." },
      { id: "i3", text: "In this study, we asked whether night-time light predicts the start of dawn song in Northern Cardinals once noise is taken into account. Cardinals are common in both urban and rural habitats in the southeastern United States, sing loudly from exposed perches, and hold territories year-round, which makes them a practical species for comparing sites. We predicted that cardinals at brighter sites would begin singing earlier relative to civil twilight, and that this relationship would hold after controlling for noise." }
    ]},
    { id: "methods", heading: "Methods", paras: [
      { id: "m1", text: "Study sites. We selected 18 sites along a 40 km gradient from the center of a mid-sized college town to surrounding farmland. Six sites fell into each of three categories (urban, suburban, rural) based on the share of impervious surface, such as pavement and rooftops, within 500 m. Sites were at least 1 km apart so that the same bird was unlikely to be recorded at two sites." },
      { id: "m2", text: "Song recordings. At each site we mounted an autonomous recorder 1.5 m above the ground and recorded from 90 minutes before to 30 minutes after civil twilight on 12 mornings between March 15 and May 10. Song onset was defined as the first cardinal song identified on a spectrogram. Two observers who did not know each site's category scored every morning independently; when they disagreed (6% of mornings), a third observer decided." },
      { id: "m3", text: "Light and noise. We measured night-time light as illuminance (lux) at ground level with a handheld photometer on three moonless nights and averaged the readings. Values ranged from 0.02 lux at the darkest rural site to 18.5 lux at the brightest urban site. We measured morning noise as the A-weighted sound level (dBA) in the recordings during the 30 minutes before civil twilight." },
      { id: "m4", text: "Analysis. We modeled song onset (minutes before civil twilight) with a linear mixed model that included log-transformed light, noise, temperature, and day of year as fixed effects and site as a random effect, which accounts for repeated mornings at the same site. Because light and noise were moderately correlated (r = 0.58), we checked variance inflation factors; all were below 2.5. We report estimates with 95% confidence intervals." }
    ]},
    { id: "results", heading: "Results", paras: [
      { id: "r1", text: "We scored song onset on 203 of 216 site-mornings; 13 mornings were lost to rain or recorder failure. Across all sites, cardinals began singing a median of 24 minutes before civil twilight (range 6–49 min)." },
      { id: "r2", text: "Song began earlier at brighter sites (Figure 1). Each tenfold increase in night-time light was associated with singing 7.1 minutes earlier (95% CI: 4.6–9.6; p < 0.001). Cardinals at the six brightest sites began singing a mean of 21 minutes earlier than those at the six darkest sites." },
      { id: "fig1", kind: "figure", text: "Figure 1. Dawn song onset (minutes before civil twilight; higher means earlier) plotted against night-time light at each of 18 sites, on a log scale. Each point is a site mean across mornings. The line shows the model estimate and the shaded band its 95% confidence interval. Colors mark site category." },
      { id: "r3", text: "Noise had a smaller and less certain effect. Each 10 dBA increase in morning noise was associated with singing 2.3 minutes earlier, but the confidence interval included zero (95% CI: −0.8 to 5.4). Warmer mornings were associated with slightly earlier singing, and onset moved earlier as the season progressed, as expected from changing day length." }
    ]},
    { id: "disc", heading: "Discussion", paras: [
      { id: "d1", text: "Our results suggest that artificial light at night, more than traffic noise, is associated with earlier dawn song in Northern Cardinals. The relationship was steady across the gradient rather than limited to the brightest downtown sites, which hints that even modest suburban lighting may be enough to shift singing." },
      { id: "d2", text: "One explanation is that night lighting makes the bird's brain register dawn earlier than the true sunrise. Another is that light lets birds see predators or rivals sooner, making early singing safer. Our data cannot separate these explanations, because we measured when birds sang, not why." },
      { id: "d3", text: "This study has important limitations. It is correlational: brighter sites may differ from darker ones in ways we did not measure, such as food supply or the age of resident birds. We did not mark individual birds, so we cannot rule out that bright sites attract early-singing birds rather than causing early singing. Our light measurements were taken on only three nights and at ground level, not at the height where cardinals roost." },
      { id: "d4", text: "If the pattern holds in experimental tests, it could matter for how towns light their streets. Shielded or dimmer lighting reduces sky glow, and testing whether such changes move singing back toward natural timing would turn this correlation into a test of cause." }
    ]},
    { id: "concl", heading: "Conclusion", paras: [
      { id: "c1", text: "Cardinals sang earlier where nights were brighter, and noise did not explain the pattern. The next step is an experiment: change the light at some sites, leave others alone, and see whether the birds' mornings change with it." }
    ]}
  ],
  // invented site means for Figure 1: [log10 lux, minutes before twilight, category]
  figure: {
    points: [[-1.70,13,"rural"],[-1.52,16,"rural"],[-1.40,12,"rural"],[-1.22,17,"rural"],[-1.05,15,"rural"],[-0.92,19,"rural"],
             [-0.55,20,"suburban"],[-0.30,24,"suburban"],[-0.12,21,"suburban"],[0.05,26,"suburban"],[0.22,25,"suburban"],[0.38,29,"suburban"],
             [0.60,31,"urban"],[0.78,36,"urban"],[0.90,34,"urban"],[1.05,39,"urban"],[1.15,37,"urban"],[1.27,41,"urban"]],
    slope: 7.1, intercept: 26.0
  }
};
