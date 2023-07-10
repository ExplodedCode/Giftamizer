import 'package:flutter/material.dart';

class ListPage extends StatelessWidget {
  ListPage({super.key, required this.page, required this.title, this.onPush});
  final String page;
  final String title;
  final ValueChanged<int>? onPush;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        // appBar: AppBar(
        //   title: Text(
        //     title,
        //   ),
        //   backgroundColor: color,
        // ),
        body: Container(
      // color: Colors.white,
      child: _buildList(context),
    ));
  }

  final List<int> materialIndices = [
    900,
  ];

  Widget _buildList(BuildContext context) {
    double width = MediaQuery.of(context).size.width;

    int crossAxisCount = 1;
    if (width < 600) {
      crossAxisCount = 1;
    } else if (width > 601 && width < 845) {
      crossAxisCount = 2;
    } else if (width > 846 && width < 1100) {
      crossAxisCount = 3;
    } else {
      crossAxisCount = 4;
    }

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1152),
        child: GridView.count(
          primary: false,
          padding: const EdgeInsets.all(8),
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          crossAxisCount: crossAxisCount,
          children: <Widget>[
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[100],
              child: Text(
                  "He'd have you all unravel at the $width - $crossAxisCount"),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[200],
              child: const Text('Heed not the rabble'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[300],
              child: const Text('Sound of screams but the'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[300],
              child: const Text('Sound of screams but the'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[300],
              child: const Text('Sound of screams but the'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[300],
              child: const Text('Sound of screams but the'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[300],
              child: const Text('Sound of screams but the'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[300],
              child: const Text('Sound of screams but the'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[300],
              child: const Text('Sound of screams but the'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[300],
              child: const Text('Sound of screams but the'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[300],
              child: const Text('Sound of screams but the'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[300],
              child: const Text('Sound of screams but the'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[400],
              child: const Text('Who scream'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[500],
              child: const Text('Revolution is coming...'),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.teal[600],
              child: const Text('Revolution, they...'),
            ),
          ],
        ),
      ),
    );

    // return Container(
    //     child: GridView.count(
    //   primary: false,
    //   padding: const EdgeInsets.all(8),
    //   crossAxisSpacing: 10,
    //   mainAxisSpacing: 10,
    //   crossAxisCount: crossAxisCount,
    //   children: <Widget>[
    //     Container(
    //       padding: const EdgeInsets.all(8),
    //       color: Colors.teal[100],
    //       child:
    //           Text("He'd have you all unravel at the $width - $crossAxisCount"),
    //     ),
    //     Container(
    //       padding: const EdgeInsets.all(8),
    //       color: Colors.teal[200],
    //       child: const Text('Heed not the rabble'),
    //     ),
    //     Container(
    //       padding: const EdgeInsets.all(8),
    //       color: Colors.teal[300],
    //       child: const Text('Sound of screams but the'),
    //     ),
    //     Container(
    //       padding: const EdgeInsets.all(8),
    //       color: Colors.teal[400],
    //       child: const Text('Who scream'),
    //     ),
    //     Container(
    //       padding: const EdgeInsets.all(8),
    //       color: Colors.teal[500],
    //       child: const Text('Revolution is coming...'),
    //     ),
    //     Container(
    //       padding: const EdgeInsets.all(8),
    //       color: Colors.teal[600],
    //       child: const Text('Revolution, they...'),
    //     ),
    //   ],
    // ));
  }
}

class CardExample extends StatelessWidget {
  const CardExample({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Card(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const ListTile(
              leading: Icon(Icons.album),
              title: Text('The Enchanted Nightingale'),
              subtitle: Text('Music by Julie Gable. Lyrics by Sidney Stein.'),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: <Widget>[
                TextButton(
                  child: const Text('BUY TICKETS'),
                  onPressed: () {/* ... */},
                ),
                const SizedBox(width: 8),
                TextButton(
                  child: const Text('LISTEN'),
                  onPressed: () {/* ... */},
                ),
                const SizedBox(width: 8),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

Card buildCard() {
  var heading = '\$2300 per month';
  var subheading = '2 bed, 1 bath, 1300 sqft';
  var cardImage =
      NetworkImage('https://source.unsplash.com/random/800x600?house');
  var supportingText =
      'Beautiful home to rent, recently refurbished with modern appliances...';
  return Card(
      elevation: 4.0,
      child: Column(
        children: [
          ListTile(
            title: Text(heading),
            subtitle: Text(subheading),
            trailing: Icon(Icons.favorite_outline),
          ),
          Container(
            height: 200.0,
            child: Ink.image(
              image: cardImage,
              fit: BoxFit.cover,
            ),
          ),
          Container(
            padding: EdgeInsets.all(16.0),
            alignment: Alignment.centerLeft,
            child: Text(supportingText),
          ),
          ButtonBar(
            children: [
              TextButton(
                child: const Text('CONTACT AGENT'),
                onPressed: () {/* ... */},
              ),
              TextButton(
                child: const Text('LEARN MORE'),
                onPressed: () {/* ... */},
              )
            ],
          )
        ],
      ));
}
