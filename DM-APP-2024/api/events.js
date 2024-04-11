
const eventsData = [
    {
      id: "0",
      name: "DJ - Drew Delimitros",
      date: "4/13 9:30AM-10:30AM",
      details: "Get excited for DJ Drew Delimitros at 9:30 - 10:30 AM.",
      image: require("../images/talent.png"),
    },
    {
      id: "1",
      name: "Openg Ceremonies",
      date: "4/13 11:00AM-12:10PM",
      details:
        "Join us in opening ceremonies as we start our Main Event 2024 from 11:00 - 12:10 PM!",
      image: require("../images/ffm.png"),
    },
    {
      id: "2",
      name: "Linedance Teaching",
      date: "4/13 12:10PM-12:30PM",
      details:
        "Join us on the floor to learn the fun and exciting linedance from 12:10 - 12:30 PM!",
      image: require("../images/linedance.png"),
    },
    {
      id: "3",
      name: "Family Story",
      date: "4/13 1:00PM-1:10PM",
      details:
        "Come down to the floor to hear Nate Ferrell tell his story at 1:00 - 1:10 PM! ",
      image: require("../images/ferrelfamily.png"),
    },
    {
      id: "4",
      name: "Family Story",
      date: "4/13 1:40PM-1:50PM",
      details:
        "Come down to the floor to hear Elie Chapman tell her story at 1:40 - 1:50 PM! ",
      image: require("../images/chapmanfamily.png"),
    },
    {
      id: "5",
      name: "Theme Hour: CandylanDM",
      date: "4/13 2:30PM-4:30PM",
      details:
        "Come down to the floor to participate in our first Theme Hour at 2:30 - 4:30 PM! Dress up in your best Candyland character outfit (or adjacent to it!) and join the fun events going on such as a board game set up, candy jar guess reveal, a gratitude tree, a licorice forest, and more! The main entertainment during this theme hour will be Dueling Pianos and Jugglers and Floor limbo! Expect to be sucked into the game of Candyland and get ready for a sweet adventure!",
      image: require("../images/candylandm.png"),
    },
    {
      id: "6",
      name: "Dueling Pianos",
      date: "4/13 2:20PM-3:10PM",
      details: "Get excited for Dueling Pianos at 2:20 - 3:10 PM.",
      image: require("../images/talent.png"),
    },
    {
      id: "7",
      name: "Family Story",
      date: "4/13 3:10PM-3:20PM",
      details:
        "Come down to the floor to hear Bailey Abbott tell her story at 3:10 - 3:20 PM! ",
      image: require("../images/abbottfamily.png"),
    },
    {
      id: "8",
      name: "Linedance Teaching",
      date: "4/13 3:20PM-3:40PM",
      details:
        "Join us on the floor to learn the fun and exciting linedance from 3:20 - 3:40 PM!",
      image: require("../images/linedance.png"),
    },
    {
      id: "9",
      name: "Merch Fashion Show",
      date: "4/13 4:00PM-4:10PM",
      details:
        "Watch the Merchandise Team on stage as they show off the new merchandise in the Merch Fashion Show from 4:00 - 4:10 PM! It is great to see what the merchandise looks like on models before buying!",
      image: require("../images/fashionshow.png"),
    },
    {
      id: "10",
      name: "Family Story",
      date: "4/13 4:20PM-4:10PM",
      details:
        "Come down to the floor to hear Alyssa Mann tell her story at 4:20 - 4:30 PM! ",
      image: require("../images/mannfamily.png"),
    },
    {
      id: "11",
      name: "Headbanding - Family Headbanding",
      date: "4/13 4:30PM-4:40PM",
      details:
        "Come join us for family headbanding from 4:30 - 4:40 PM and 9:20 - 9:30 AM!",
      image: require("../images/headbanding.png"),
    },
    {
      id: "12",
      name: "Pop-Up Rave",
      date: "4/13 4:40PM-5:00PM",
      details: "Get excited for Pop-Up Rave at 4:40 - 5:00 PM.",
      image: require("../images/talent.png"),
    },
    {
      id: "13",
      name: "HS Reveal",
      date: "4/13 5:00PM-5:15PM",
      details:
        "Come join us to see all the great things our local high schools have accomplished at the high school reveal at 5:00 - 5:15 PM! Come see all their hard work come to life!",
      image: require("../images/ffm.png"),
    },
    {
      id: "14",
      name: "HS Mini Linedance",
      date: "4/13 5:20PM-5:30PM",
      details:
        "Come join us to see all the great things our local high schools have accomplished in VIDEO FORM with the high school mini cut at 5:20 - 5:30 PM! Come see all their hard work come to life right after the reveal!",
      image: require("../images/linedance.png"),
    },
    {
      id: "15",
      name: "Family Story",
      date: "4/13 5:30PM-5:40PM",
      details:
        "Come down to the floor to hear Jude & Oliver Sleeper tell their story at 5:30 - 5:40 PM! ",
      image: require("../images/sleeperfamily.png"),
    },
    {
      id: "16",
      name: "Theme Hour: DM Rocks",
      date: "4/13 6:40PM-8:40PM",
      details:
        "Come down to the floor to participate in our second Theme Hour at 6:40 - 8:40 PM! Dress up in your best rock and roll outfit (even with a simple band tee!) and join the fun events going on such as reading people's lips, a photo booth, a rock coloring station, a rocking chair sitting, and more! The main entertainment during this theme hour will be The Noise Next Door, an air guitar off, and a floor wide rock paper scissors game! Expect a whole two hours of rocking and rolling!",
      image: require("../images/dmrocks.png"),
    },
    {
      id: "17",
      name: "THE NOISE NEXT DOOR",
      date: "4/13 6:50PM-7:20PM",
      details: "Get excited for The Noise Next Door at 6:50 - 7:20 PM..",
      image: require("../images/talent.png"),
    },
    {
      id: "18",
      name: "Family Story",
      date: "4/13 7:40PM-7:50PM",
      details:
        "Come down to the floor to hear Suzanne Lugrin tell her story at 7:40 - 7:50 PM! ",
      image: require("../images/lugrinfamily.png"),
    },
    {
      id: "19",
      name: "Miracle Child Talent Show",
      date: "4/13 7:40PM-8:00PM",
      details:
        "Come join us to see the miracle children show off their incredible talents at 7:40 - 8:00 PM!",
      image: require("../images/miracletalent.png"),
    },
    {
      id: "20",
      name: "In Memoriam",
      date: "4/13 9:00PM-9:30PM",
      details:
        "Join us on the floor to honor Nina Karlinsky and hear Dr. Karlinsky speak at 9:00 - 9:30 PM!",
      image: require("../images/hitthegong.png"),
    },
    {
      id: "21",
      name: "HYPNOTIST",
      date: "4/13 10:00PM-10:30PM",
      details: "Get excited for the Hypnotist at 10:00 - 10:30 PM.",
      image: require("../images/talent.png"),
    },
    {
      id: "22",
      name: "2023 Linedance",
      date: "4/13 10:30PM-10:40PM",
      details: "Join us on the floor to do the 2023 Linedance!",
      image: require("../images/linedance.png"),
    },
    {
      id: "23",
      name: "Theme Hour: Night at the Main Event",
      date: "4/13 11:10PM-1:10AM",
      details:
        "Come down to the floor to participate in our third Theme Hour at 11:10 - 1:10 AM! Dress up as your favorite character from the movie (examples include a dinosaur, Teddy Roosevelt, a security guard, and more!) and join the fun events going on such as a tablet scavenger hunt, digging for dinosaur bones, coloring crowns, jewelry crafting, and more! The main entertainment during this theme hour will be Sigs Inside, karaoke, and a statues frozen game! Expect to be transported back in time!",
      image: require("../images/nightatthemainevent.png"),
    },
    {
      id: "24",
      name: "SIGS INSIDE",
      date: "4/14 12:00AM-12:30AM",
      details: "Get excited for Sigs Inside at 12:00 - 12:30 AM.",
      image: require("../images/talent.png"),
    },
    {
      id: "25",
      name: "RAVE - GRAHAM DENAULT",
      date: "4/14 1:30AM-2:30AM",
      details: "Get excited for the Rave with Graham Denault at 1:30 - 2:30 AM.",
      image: require("../images/ravegram.png"),
    },
    {
      id: "26",
      name: "ELPageant",
      date: "4/14 3:00AM-4:30AM",
      details:
        "Join us on the floor from 3:00 - 4:30 AM see the captain teams compete! Let's see who will win!",
      image: require("../images/elpageant.png"),
    },
    {
      id: "27",
      name: "ELP Linedance",
      date: "4/14 4:30AM-4:40AM",
      details: "Join us on the floor to learn the fun and exciting linedance",
      image: require("../images/linedance.png"),
    },
    {
      id: "28",
      name: "Theme Hour: Gainesvegas",
      date: "4/14 4:40AM-6:40AM",
      details:
        "Come down to the floor to participate in our fourth Theme Hour at 4:40 - 6:40 AM! Dress up as your favorite Gainesville celebrity or Vegas character (or just wear any UF gear!) and join the fun events going on such as cornhole, gaga ball, card tables, and more! The main entertainment during this theme hour will be Silent Disco, Family Feud, and Floridance! We will be bringing the icons of Las Vegas to our Gainesville landscape!",
      image: require("../images/gainesvegas.png"),
    },
    {
      id: "29",
      name: "SILENT DISCO - Evan Russo, Trent Brodow, Zach Morrow",
      date: "4/14 4:40AM-5:40AM",
      details:
        "Get excited for the Silent Disco with Evan Russo, Trent Brodows, and Zach Morrow at 4:40 - 5:40 AM.",
      image: require("../images/talent.png"),
    },
    {
      id: "30",
      name: "FLORIDANCE",
      date: "4/14 6:00AM-6:10AM",
      details: "Get excited for Floridance at 6:00 - 6:10 AM.",
      image: require("../images/talent.png"),
    },
    {
      id: "32",
      name: "2021 Linedance",
      date: "4/14 6:20AM-6:30AM",
      details: "Join us on the floor to do the 2021 linedance",
      image: require("../images/linedance.png"),
    },
    {
      id: "33",
      name: "Senior Ceremony",
      date: "4/14 6:30AM-7:20AM",
      details:
        "Join us on the floor from 6:30 - 7:20 AM to see the seniors be honored at the senior ceremony! It will be a heartwarming time!",
      image: require("../images/seniorceremony.png"),
    },
    {
      id: "34",
      name: "Senior Linedance",
      date: "4/14 7:10AM-7:20AM",
      details: "Join us on the floor as we do the senior linedance from their freshman year!",
      image: require("../images/linedance.png"),
    },
    {
      id: "35",
      name: "YOGA - EMMA SUGARMAN",
      date: "4/14 7:20AM-7:40AM",
      details: "Get excited for Yoga with Emma Sugarman at 7:20 - 7:40 AM.",
      image: require("../images/talent.png"),
    },
    {
      id: "37",
      name: "Theme Hour: NickeloDM",
      date: "4/14 8:00AM-10:00AM",
      details:
        "Come down to the floor to participate in our fifth and final Theme Hour at 8:00 - 10:00 AM! Dress up as your favorite Nickelodeon characters (examples include SpongeBob, Patrick, Cosmo, Wanda, etc.)! The main entertainment during this theme hour will be Miracle Kids Choice Awards, Gator Band, ring the bell, and Random Dancing! It will be the most nostalgic time!",
      image: require("../images/nickelodm.png"),
    },
    {
      id: "38",
      name: "Mazzy Jester Story",
      date: "4/14 8:10AM-8:20AM",
      details:
        "Come down to the floor to hear Mazzy Jester tell her story at 8:10 - 8:20 AM! ",
      image: require("../images/jesterfamily.png"),
    },
    {
      id: "39",
      name: "Gator Band",
      date: "4/14 9:00AM-9:10AM",
      details: "Get excited for the Gator Band at 9:00 - 9:10 AM.",
      image: require("../images/talent.png"),
    },
    {
      id: "40",
      name: "Headbanding",
      date: "4/14 9:20AM-9:30AM",
      details: "Headbanding event details...",
      image: require("../images/headbanding.png"),
    },
    {
      id: "41",
      name: "Family Story",
      date: "4/14 9:50AM-10:00AM",
      details:
        "Come down to the floor to hear Samuel Negron tell his story at 9:50 - 10:00 AM! .",
      image: require("../images/negronfamily.png"),
    },
    {
      id: "42",
      name: "HIP HOP FITNESS",
      date: "4/14 10:00AM-10:20AM",
      details: "Get excited for Hip Hop Fitness at 10:00 - 10:30 AM.",
      image: require("../images/talent.png"),
    },
    {
      id: "44",
      name: "Family Linedance",
      date: "4/14 10:30AM-10:40AM",
      details: "Join us on the floor as we do the linedance with the families!",
      image: require("../images/linedance.png"),
    },
    {
      id: "45",
      name: "Family Story",
      date: "4/14 10:40AM-10:50AM",
      details:
        "Come down to the floor to hear Beckett Genuardi tell his story at 10:40 - 10:50 AM! ",
      image: require("../images/genuardifamily.png"),
    },
    {
      id: "46",
      name: "Family Story",
      date: "4/14 12:00PM-12:10PM",
      details:
        "Come down to the floor to hear Sage Pridemore tell his story at 12:00 - 12:10 PM! ",
      image: require("../images/pridemorefamily.png"),
    },
    {
      id: "47",
      name: "Lifetime Fundraising",
      date: "4/14 12:30PM-12:50PM",
      details:
        "Join us to recognize our Lifetime Fundraisers from 12:30 - 12:50 PM!",
      image: require("../images/lifetimefundraising.png"),
    },
    {
      id: "48",
      name: "Family Story",
      date: "4/14 1:00PM-1:10PM",
      details:
        "Come down to the floor to hear Kendall Lewis tell her story at 1:00 - 1:10 PM!",
      image: require("../images/lewisfamily.png"),
    },
    {
      id: "49",
      name: "BAND CUTTING",
      date: "4/14 1:40PM-2:00PM",
      details:
        "Join us in band cutting from 1:40 - 2:00 PM to recognize the end of our time at Main Event 2024.",
      image: require("../images/ffm.png"),
    },
    {
      id: "50",
      name: "Family Story",
      date: "4/14 2:00PM-2:10PM",
      details:
        "Come down to the floor to hear Dani-Lynn Early tell her story at 2:00 - 2:10 PM!",
      image: require("../images/earlyfamily.png"),
    },
    {
      id: "51",
      name: "CLOSING CEREMONIES",
      date: "4/14 2:00PM-2:10PM",
      details:
        "Join us in closing ceremonies as we close out Main Event 2024 starting at 2:00 PM!",
      image: require("../images/ffm.png"),
    },
  ];
  
  export default eventsData;
  