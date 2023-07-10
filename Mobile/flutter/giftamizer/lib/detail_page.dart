import 'package:flutter/material.dart';

class DetailPage extends StatelessWidget {
  const DetailPage(
      {super.key,
      required this.page,
      required this.title,
      this.materialIndex = 500});
  final String page;
  final String title;
  final int materialIndex;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        // backgroundColor: color,
        title: Text(
          '$title[$materialIndex]',
        ),
      ),
      body: Container(
          // color: color[materialIndex],
          ),
    );
  }
}
