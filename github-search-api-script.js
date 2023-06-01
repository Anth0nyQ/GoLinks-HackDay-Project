//Global variable for token in order to perform authenticated GET's

//PUT YOUR TOKEN HERE TO AVOID COOLDOWNS
var token = 'TOKEN-HERE';


$(document).ready(function() {

    $.ajaxSetup(
        {
            headers:
            {
                'Authorization': 'Bearer ' + token
            }
        }
    )

    //Searching for Username value and include forks checkbox value
    $("#search-user-stats").on("click", function(event) {
        //prevent autosubmission
        event.preventDefault();

        var username = $("#username").val();
        var includeForks = $("#include-forks").is(":checked");

        //alert(username);

        getUserStats(username, includeForks);
    })

    //Searching through a list of users
    $("#search-by-username").on("click", function(event) {
        //prevent autosubmission
        event.preventDefault();

        var usernameSearch = $("#search-username").val();
        var includeForks = $("#include-forks").is(":checked");

        //Checking if search-by-username was left empty
        if (usernameSearch === "")
        {
            alert("Please enter a username or a portion of a username to search.");
            return;
        }

        searchUsers(usernameSearch, includeForks);
    });

    // Handle avatar element stat requests
    $(document).on("click", ".user-profile-link", function(event) {
    event.preventDefault();

    var username = $(this).find("img").data("username");
    var includeForks = $("#include-forks").is(":checked");

    getUserStats(username, includeForks);
  });

});

//Help function for calculating size in correct units
function calculateSize(size)
{
    var units = ['KB', 'MB', 'GB'];
    var unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) 
    {
        size /= 1024;
        unitIndex++;
    }
    return size.toFixed(2) + ' ' + units[unitIndex];
}

function getUserStats(username, includeForks) {
    var reposPerPage = 100;
    var apiURL = `https://api.github.com/users/${username}/repos?per_page=${reposPerPage}`;
  
    var totalRepoCount = 0;
    var totalStargaze = 0;
    var totalForks = 0;
    var totalSize = 0;
    var languages = {};
  
    function fetchPage(page) {
      $.get({
        url: `${apiURL}&page=${page}`,
        dataType: 'json',
        success: function(data) {
          data.forEach(function(repo) {
            if (!includeForks && repo.fork) {
              return;
            }
            totalStargaze += repo.stargazers_count;
            totalForks += repo.forks_count;
            totalSize += repo.size;
            if (repo.language) {
              if (languages[repo.language]) {
                languages[repo.language]++;
              } else {
                languages[repo.language] = 1;
              }
            }
            totalRepoCount++;
          });
        },
        complete: function(jqXHR, textStatus) {
          var linkHeader = jqXHR.getResponseHeader('Link');
          var links = parseLinkHeader(linkHeader);
          var nextPageUrl = links['next'];
          if (nextPageUrl) {
            var nextPage = parseInt(nextPageUrl.match(/page=(\d+)/)[1]);
            fetchPage(nextPage);
          } else {
            var averagefileSize = calculateSize(totalSize / totalRepoCount);
            var sortedLangList = Object.entries(languages)
              .sort((a, b) => b[1] - a[1])
              .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  
            var userStats = {
              totalRepoCount: totalRepoCount,
              totalStargaze: totalStargaze,
              totalForks: totalForks,
              averageSize: averagefileSize,
              languages: sortedLangList
            };
  
            $("#search-results").text(JSON.stringify(userStats, null, 2));
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.status === 404)
            {
                alert('Error 404: User not found or search left empty.');
            } else {
                console.error('Error:', textStatus, errorThrown);
            }
        }
      });
    }
  
    fetchPage(1);
}

//Helper function used to get the link for the next page of repos
function parseLinkHeader(header) {
    var links = {};
    if (!header) {
      return links;
    }
    var parts = header.split(',');
    var linkRegex = /<([^>]+)>;\s*rel="([^"]+)"/;
    for (var i = 0; i < parts.length; i++) {
      var match = linkRegex.exec(parts[i]);
      if (match) {
        var url = match[1];
        var rel = match[2];
        links[rel] = url;
      }
    }
    return links;
}

//Function to search for users with portions of a username that match
function searchUsers(username) {

    //Used to clear the previous searched username
    $("#search-results").empty();

    //Grabbing the users associated with the text stored in username
    fetch("https://api.github.com/search/users?q=" + username + "+in:user&per_page=100")
        .then(response => response.json())
        .then(data => {
            console.log(data);

            data.items.forEach(item => {
                var user = `<a href="#" class="user-profile-link"> <img class="img-thumbnail ml-4" width="100" height="100" src="${item.avatar_url}" data-username="${item.login}"> </a>`;

                $("#profile-results").append(user);
            });
        })
        .catch(error => console.error(error));
}

//Original implementation not counting more than 100 repos on a user below

// function getUserStats(username, includeForks)
// {
//     //Page number
//     var page = 1;

//     //repos shown per page
//     var reposPerPage = 100;

//     //declaration of standard api link
//     var apiURL = `https://api.github.com/users/${username}/repos?per_page=${reposPerPage}&page=${page}`;


//     $.get(apiURL, function(data)
//     {
//         var totalRepoCount = data.length;
//         var totalStargaze = 0;
//         var totalForks = 0;
//         var totalSize = 0;
//         var languages = {};

//         //Counting repos
//         data.forEach(function(repo) {
            
//             //Checking if repo is fork
//             if (!includeForks && repo.fork)
//             {
//                 return; //Skip repo if fork
//             }

//             totalStargaze += repo.stargazers_count;
//             totalForks += repo.forks_count;
//             totalSize += repo.size;

//             //counting languages user used
//             if (repo.language) {
//                 if (languages[repo.language]) {
//                     languages[repo.language]++;
//                 }
//                 else
//                 {
//                     languages[repo.language] = 1;
//                 }
//             }
//         });

//         //calculate average size of files in their appropiate units (bytes, KB, MB, GB)
//         var averagefileSize = calculateSize(totalSize / totalRepoCount);

//         //sort languages by count in their descending order
//         var sortedLangList = Object.entries(languages)
//         .sort((a,b) => b[1] - a[1])
//         .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});

//         //creating user stats object to display stats properly
//         var userStats = {
//             totalRepoCount: totalRepoCount,
//             totalStargaze: totalStargaze,
//             totalForks: totalForks,
//             averageSize: averagefileSize,
//             languages: sortedLangList
//         };

//         $("#search-results").text(JSON.stringify(userStats, null, 2));
//     });
// }
